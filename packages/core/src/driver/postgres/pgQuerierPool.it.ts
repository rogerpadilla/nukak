import { createSpec } from '../../test';
import { BaseSqlQuerierPoolIt } from '../baseSqlQuerierPoolIt';
import { PgQuerierPool } from './pgQuerierPool';
import { escapeId as postgresEscapeId } from './postgresDialect';

export class PostgresQuerierPoolIt extends BaseSqlQuerierPoolIt {
  readonly primaryKeyType = 'SERIAL PRIMARY KEY';

  constructor() {
    super(
      new PgQuerierPool({
        host: '0.0.0.0',
        port: 5432,
        user: 'test',
        password: 'test',
        database: 'test',
      })
    );
  }

  escapeId(val: string) {
    return postgresEscapeId(val);
  }
}

createSpec(new PostgresQuerierPoolIt());