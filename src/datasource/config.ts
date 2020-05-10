import { QuerierOptions } from './type';

let cache: QuerierOptions;

export function initDatasourceConfig(opts: QuerierOptions) {
  cache = opts;
}

export function getDatasourceConfig(): QuerierOptions {
  return cache;
}
