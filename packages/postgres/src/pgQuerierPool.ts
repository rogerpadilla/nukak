import { Pool, PoolConfig } from 'pg';
import { QuerierLogger, QuerierPool } from '@uql/core/type/index.js';
import { PgQuerier } from './pgQuerier.js';

export class PgQuerierPool implements QuerierPool<PgQuerier> {
  readonly pool: Pool;

  constructor(opts: PoolConfig, readonly logger?: QuerierLogger) {
    this.pool = new Pool(opts);
  }

  async getQuerier() {
    const conn = await this.pool.connect();
    return new PgQuerier(conn, this.logger);
  }

  async end() {
    await this.pool.end();
  }
}
