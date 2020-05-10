import {
  Repository,
  GenericRepositoryConstructor,
  CustomRepositoryConstructor,
  ClientRepository,
  ServerRepository,
} from './type';

let cache = new WeakMap<{ new (): any }, Repository<any>>();
let defaultRepositoryConstructor: GenericRepositoryConstructor<any>;

function getRepository<T>(type: { new (): T }): Repository<T> {
  if (!cache.has(type)) {
    if (!defaultRepositoryConstructor) {
      throw new Error(
        `Either a generic repository or a specific repository (for the type ${type.name}) must be registered first`
      );
    }
    cache.set(type, new defaultRepositoryConstructor(type));
  }
  return cache.get(type);
}

export function getClientRepository<T>(type: { new (): T }): ClientRepository<T> {
  return getRepository(type);
}

export function getServerRepository<T>(type: { new (): T }): ServerRepository<T> {
  return getRepository(type);
}

export function setDefaultRepository(constructor: GenericRepositoryConstructor<any>) {
  defaultRepositoryConstructor = constructor;
}

export function setRepository(constructor: CustomRepositoryConstructor<any>) {
  const repository = new constructor();
  cache.set(repository.type, repository);
}

/**
 * Useful for unit-testing
 */
export function resetContainer() {
  defaultRepositoryConstructor = undefined;
  cache = new WeakMap<{ new (): any }, Repository<any>>();
}
