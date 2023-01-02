import type { Type } from './utility.js';
import type { Query, QueryCriteria, QueryOne, QueryOptions, QueryProject, QuerySearch } from './query.js';
import type { UniversalRepository } from './repository.js';
import type { IdValue } from './entity.js';

/**
 * A `querier` allows to interact with the datasource to perform persistence operations on any entity.
 */
export interface UniversalQuerier {
  /**
   * obtains the record with the given primary key.
   * @param entity the target entity
   * @param id the primary key value
   * @return the record
   */
  findOneById<E, P extends QueryProject<E>>(entity: Type<E>, id: IdValue<E>, project?: P): Promise<any>;

  /**
   * obtains the first record matching the given search parameters.
   * @param entity the target entity
   * @param qm the criteria options
   * @return the record
   */
  findOne<E, P extends QueryProject<E>>(entity: Type<E>, qm: QueryOne<E>, project?: P): Promise<any>;

  /**
   * obtains the records matching the given search parameters.
   * @param entity the target entity
   * @param qm the criteria options
   * @return the records
   */
  findMany<E, P extends QueryProject<E>>(entity: Type<E>, qm: QueryCriteria<E>, project?: P): Promise<any>;

  /**
   * obtains the records matching the given search parameters,
   * also counts the number of matches ignoring pagination.
   * @param entity the target entity
   * @param qm the criteria options
   * @return the records and the count
   */
  findManyAndCount<E, P extends QueryProject<E>>(entity: Type<E>, qm: QueryCriteria<E>, project?: P): Promise<any>;

  /**
   * counts the number of records matching the given search parameters.
   * @param entity the target entity
   * @param qm the search options
   * @return the count
   */
  count<E>(entity: Type<E>, qm?: QuerySearch<E>): Promise<any>;

  /**
   * inserts a record.
   * @param entity the entity to persist on
   * @param payload the data to be persisted
   * @return the ID
   */
  insertOne<E>(entity: Type<E>, payload: E): Promise<any>;

  /**
   * Inserts many records.
   * @param entity the entity to persist on
   * @param payload the data to be persisted
   * @return the IDs
   */
  insertMany?<E>(entity: Type<E>, payload: E[]): Promise<any>;

  /**
   * updates a record partially.
   * @param entity the entity to persist on
   * @param id the primary key of the record to be updated
   * @param payload the data to be persisted
   * @return the number of affected records
   */
  updateOneById<E>(entity: Type<E>, id: IdValue<E>, payload: E): Promise<any>;

  /**
   * updates many records partially.
   * @param entity the entity to persist on
   * @param qm the criteria to look for the records
   * @param payload the data to be persisted
   * @return the number of affected records
   */
  updateMany?<E>(entity: Type<E>, qm: QuerySearch<E>, payload: E): Promise<any>;

  /**
   * insert or update a record.
   * @param entity the entity to persist on
   * @param payload the data to be persisted
   * @return the ID
   */
  saveOne<E>(entity: Type<E>, payload: E): Promise<any>;

  /**
   * Insert or update records.
   * @param entity the entity to persist on
   * @param payload the data to be persisted
   * @return the IDs
   */
  saveMany?<E>(entity: Type<E>, payload: E[]): Promise<any>;

  /**
   * delete or SoftDelete a record.
   * @param entity the entity to persist on
   * @param id the primary key of the record
   * @return the number of affected records
   */
  deleteOneById<E>(entity: Type<E>, id: IdValue<E>, opts?: QueryOptions): Promise<any>;

  /**
   * delete or SoftDelete records.
   * @param entity the entity to persist on
   * @param qm the criteria to look for the records
   * @return the number of affected records
   */
  deleteMany<E>(entity: Type<E>, qm: QuerySearch<E>, opts?: QueryOptions): Promise<any>;

  /**
   * get a repository for the given entity.
   * @param entity the entity to get the repository for
   * @return the repository
   */
  getRepository<E>(entity: Type<E>): UniversalRepository<E>;
}
