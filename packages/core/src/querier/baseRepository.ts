import { FieldValue, Querier, Query, QueryCriteria, QueryOne, QueryOptions, Repository, Type } from '../type';

export class BaseRepository<E> implements Repository<E> {
  constructor(readonly entity: Type<E>, readonly querier: Querier) {}

  insertMany(payload: E[]) {
    return this.querier.insertMany(this.entity, payload);
  }

  insertOne(payload: E) {
    return this.querier.insertOne(this.entity, payload);
  }

  updateMany(qm: QueryCriteria<E>, payload: E) {
    return this.querier.updateMany(this.entity, qm, payload);
  }

  updateOneById(id: FieldValue<E>, payload: E) {
    return this.querier.updateOneById(this.entity, id, payload);
  }

  findMany(qm: Query<E>) {
    return this.querier.findMany(this.entity, qm);
  }

  findOne(qm: QueryOne<E>) {
    return this.querier.findOne(this.entity, qm);
  }

  findOneById(id: FieldValue<E>, qm?: QueryOne<E>) {
    return this.querier.findOneById(this.entity, id, qm);
  }

  deleteMany(qm: QueryCriteria<E>, opts?: QueryOptions) {
    return this.querier.deleteMany(this.entity, qm, opts);
  }

  deleteOneById(id: FieldValue<E>, opts?: QueryOptions) {
    return this.querier.deleteOneById(this.entity, id, opts);
  }

  count(qm: QueryCriteria<E>) {
    return this.querier.count(this.entity, qm);
  }
}
