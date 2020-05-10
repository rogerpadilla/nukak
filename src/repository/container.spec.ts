import { User, Item } from '../entity/entityMock';
import { GenericClientRepository } from './genericClientRepository';
import { GenericServerRepository } from './genericServerRepository';
import { getServerRepository, resetContainer } from './container';
import { CustomRepository, GenericRepository } from './decorator';

afterEach(() => {
  resetContainer();
});

it('generic', () => {
  const repository = getServerRepository(User);
  expect(repository).toBeInstanceOf(GenericServerRepository);
});

it('no repository', () => {
  expect(() => getServerRepository(User)).toThrowError(
    'Either a generic repository or a specific repository (for the type User) must be registered first'
  );
});

it('@GenericRepository(), @Repository()', () => {
  @CustomRepository()
  class UserRepository extends GenericClientRepository<User, number> {
    constructor() {
      super(User);
    }
  }

  @GenericRepository()
  class SomeGenericRepository extends GenericServerRepository<any, number> {}

  expect(getServerRepository(Item)).toBeInstanceOf(SomeGenericRepository);
  expect(getServerRepository(Item)).not.toBeInstanceOf(UserRepository);
  expect(getServerRepository(User)).toBeInstanceOf(UserRepository);
  expect(getServerRepository(User)).not.toBeInstanceOf(SomeGenericRepository);
});
