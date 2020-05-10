import { get, post, put, remove, RequestOptions } from '../http';
import { Query, QueryFilter, QueryPopulate, QueryOne } from '../type';
import { stringifyQuery, stringifyQueryFilter } from '../util/query.util';
import { formatKebabCase } from '../util/string.util';
import { getEntityId } from '../entity';
import { ClientRepository } from './type';
import { GenericRepository } from './decorator';

@GenericRepository()
export class GenericClientRepository<T, ID> implements ClientRepository<T, ID> {
  protected readonly idName = getEntityId(this.type);

  /**
   * The base-path for the endpoints. Children could override it if necessary (by using a getter
   * with the same name). For instance, when endpoints are not under path '/api/', or when using
   * something like '/api/v1/'. It can also be dynamically calculated if necessary.
   */
  protected readonly basePath = '/api/' + formatKebabCase(this.type.name);

  constructor(readonly type: { new (): T }) {}

  insertOne(body: T, opts?: RequestOptions) {
    return post<ID>(this.basePath, body, opts);
  }

  updateOneById(id: ID, body: T, opts?: RequestOptions) {
    return put<number>(`${this.basePath}/${id}`, body, opts);
  }

  saveOne(body: T, opts?: RequestOptions) {
    const id: ID = body[this.idName];
    if (id) {
      return put<ID>(`${this.basePath}/${id}`, body, opts);
    }
    return this.insertOne(body, opts);
  }

  findOneById(id: ID, qm: QueryPopulate<T>, opts?: RequestOptions) {
    const qs = stringifyQuery(qm);
    return get<T>(`${this.basePath}/${id}${qs}`, opts);
  }

  findOne(qm: QueryOne<T>, opts?: RequestOptions) {
    const qs = stringifyQuery(qm);
    return get<T>(`${this.basePath}/one${qs}`, opts);
  }

  find(qm: Query<T>, opts?: RequestOptions) {
    const qs = stringifyQuery(qm);
    return get<T[]>(`${this.basePath}${qs}`, opts);
  }

  removeOneById(id: ID, opts?: RequestOptions) {
    return remove<number>(`${this.basePath}/${id}`, opts);
  }

  remove(filter: QueryFilter<T>, opts?: RequestOptions) {
    const qs = stringifyQueryFilter(filter);
    return remove<number>(`${this.basePath}?${qs}`, opts);
  }

  count(filter: QueryFilter<T>, opts?: RequestOptions) {
    const qs = stringifyQueryFilter(filter);
    return get<number>(`${this.basePath}/count${qs}`, opts);
  }
}
