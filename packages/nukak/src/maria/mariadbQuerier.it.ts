import { AbstractSqlQuerierIt } from 'nukak/querier/abstractSqlQuerier-it';
import { createSpec } from 'nukak/test';
import { MariadbQuerierPool } from './mariadbQuerierPool';

export class MariadbQuerierIt extends AbstractSqlQuerierIt {
  constructor() {
    super(
      new MariadbQuerierPool({
        host: '0.0.0.0',
        port: 3326,
        user: 'test',
        password: 'test',
        database: 'test',
        connectionLimit: 5,
        trace: true,
        bigIntAsNumber: true,
      }),
      'INT AUTO_INCREMENT PRIMARY KEY'
    );
  }
}

createSpec(new MariadbQuerierIt());