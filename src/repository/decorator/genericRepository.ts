import { GenericRepositoryConstructor } from '../type';
import { setDefaultRepository } from '../container';

export function GenericRepository() {
  return (repositoryClass: GenericRepositoryConstructor<any>) => {
    setDefaultRepository(repositoryClass);
  };
}
