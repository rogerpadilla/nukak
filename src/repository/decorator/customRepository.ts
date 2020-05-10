import { CustomRepositoryConstructor } from '../type';
import { setRepository } from '../container';

export function CustomRepository() {
  return (repository: CustomRepositoryConstructor<any>) => {
    setRepository(repository);
  };
}
