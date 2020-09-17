import { FilterQuery, ObjectId } from 'mongodb';
import { QueryFilter, Query } from '../../type';
import { EntityMeta, getEntityMeta } from '../../entity';

export class MongoDialect {
  buildFilter<T>(type: { new (): T }, filter: QueryFilter<T> = {}): FilterQuery<T> {
    const meta = getEntityMeta(type);

    return Object.keys(filter).reduce((acc, prop) => {
      if (prop === '$and' || prop === '$or') {
        const value = filter[prop];
        acc[prop] = Object.keys(value).map((prop) => {
          const { key, val } = getFinalKeyVal(prop, value[prop], meta);
          return { [key]: val };
        });
      } else {
        const { key, val } = getFinalKeyVal(prop, filter[prop], meta);
        acc[key] = val;
      }
      return acc;
    }, {});
  }

  buildAggregationPipeline<T>(type: { new (): T }, qm: Query<T>): object[] {
    const meta = getEntityMeta(type);

    const pipeline: object[] = [];

    if (qm.filter && Object.keys(qm.filter).length) {
      pipeline.push({ $match: this.buildFilter(type, qm.filter) });
    }

    for (const popKey in qm.populate) {
      const relOpts = meta.relations[popKey];
      if (!relOpts) {
        throw new Error(`'${type.name}.${popKey}' is not annotated with a relation decorator`);
      }
      const relType = relOpts.type();
      const relMeta = getEntityMeta(relType);
      pipeline.push({
        $lookup: {
          from: relType.name,
          localField: popKey,
          foreignField: relMeta.id.name,
          as: popKey,
        },
      });
      pipeline.push({ $unwind: { path: `$${popKey}`, preserveNullAndEmptyArrays: true } });
    }

    return pipeline;
  }
}

function getFinalKeyVal<T>(key: string, val: any, meta: EntityMeta<T>) {
  if (key === meta.id.property) {
    const objectId = val instanceof ObjectId ? val : new ObjectId(val);
    return { key: '_id', val: objectId };
  }
  return { key, val };
}