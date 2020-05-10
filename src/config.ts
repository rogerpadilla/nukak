import { CorozoOptions } from './type';
import { initDatasourceConfig } from './datasource';
import { setDefaultRepository } from './repository';

export function initCorozoConfig(conf: CorozoOptions) {
  setDefaultRepository(conf?.defaultRepositoryClass);
  initDatasourceConfig(conf?.datasource);
}
