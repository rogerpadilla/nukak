import { GenericRepositoryConstructor } from '../repository/type';
import { QuerierOptions } from '../datasource/type';

export type CorozoOptions = { defaultRepositoryClass: GenericRepositoryConstructor<any>; datasource: QuerierOptions };
