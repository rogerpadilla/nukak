import { createSpec } from 'nukak/test';
import { AbstractQuerierPoolIt } from 'nukak/querier/abstractQuerierPool-it.js';
import { MariadbQuerierPool } from './mariadbQuerierPool.js';
import { MariadbQuerier } from './mariadbQuerier.js';

export class MariadbQuerierPoolIt extends AbstractQuerierPoolIt<MariadbQuerier> {
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
    );
  }
}

createSpec(new MariadbQuerierPoolIt());
