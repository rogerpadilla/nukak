import { Query, QueryOne, UniversalRepository, QueryCriteria } from '@uql/core/type';
import { RequestOptions, RequestSuccessResponse } from './request';

export interface ClientRepository<E> extends UniversalRepository<E> {
  insertMany?(bodies: E[], opts?: RequestOptions): Promise<RequestSuccessResponse<any[]>>;

  insertOne(body: E, opts?: RequestOptions): Promise<RequestSuccessResponse<any>>;

  updateMany?(body: E, qm: QueryCriteria<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<number>>;

  saveOne(body: E, opts?: RequestOptions): Promise<RequestSuccessResponse<E>>;

  findMany(qm: Query<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<E[]>>;

  findOne(qm: Query<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<E>>;

  findOneById(id: any, qo: QueryOne<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<E>>;

  deleteMany(qm: QueryCriteria<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<number>>;

  deleteOneById(id: any, opts?: RequestOptions): Promise<RequestSuccessResponse<number>>;

  count(qm: QueryCriteria<E>, opts?: RequestOptions): Promise<RequestSuccessResponse<number>>;
}