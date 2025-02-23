import { escape } from 'sqlstring';
import { AbstractSqlDialect } from 'nukak/dialect';

export class MySqlDialect extends AbstractSqlDialect {
  override escape(value: unknown): string {
    return escape(value);
  }
}
