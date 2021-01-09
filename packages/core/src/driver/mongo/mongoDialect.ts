import { FilterQuery, ObjectId } from 'mongodb';
import { QueryFilter, Query, EntityMeta } from '../../type';
import { getEntityMeta } from '../../entity/decorator';

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
        throw new TypeError(`'${type.name}.${popKey}' is not annotated as a relation`);
      }
      if (relOpts.cardinality !== 'manyToOne' && relOpts.cardinality !== 'oneToOne') {
        // 'manyToMany' and 'oneToMany' will need multiple queries (so they should be resolved in a higher layer)
        continue;
      }
      const relType = relOpts.type();
      const relMeta = getEntityMeta(relType);

      if (relOpts.cardinality === 'manyToOne') {
        pipeline.push({
          $lookup: {
            from: relMeta.name,
            localField: popKey,
            foreignField: '_id',
            as: popKey,
          },
        });
      } else {
        pipeline.push({
          $lookup: {
            from: relMeta.name,
            pipeline: [{ $match: { [relOpts.mappedBy]: qm.filter[meta.id.name] } }],
            as: popKey,
          },
        });
      }

      pipeline.push({ $unwind: { path: `$${popKey}`, preserveNullAndEmptyArrays: true } });
    }

    return pipeline;
  }
}

function getFinalKeyVal<T>(key: string, val: any, meta: EntityMeta<T>) {
  if (key === '_id' || key === meta.id.property) {
    const objectId = val instanceof ObjectId ? val : new ObjectId(val);
    return { key: '_id', val: objectId };
  }
  return { key, val };
}
