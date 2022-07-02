import { connect, MongoClientOptions } from 'mongodb';
import { QuerierLogger, QuerierPool } from '@uql/core/type/index.js';
import { MongodbQuerier } from './mongodbQuerier.js';
import { MongoDialect } from './mongoDialect.js';

export class MongodbQuerierPool implements QuerierPool<MongodbQuerier> {
  private querier: MongodbQuerier;

  constructor(readonly uri: string, readonly opts?: MongoClientOptions, readonly logger?: QuerierLogger) {}

  async getQuerier() {
    if (!this.querier || !this.querier.conn.isConnected()) {
      const conn = await connect(this.uri, this.opts);
      this.querier = new MongodbQuerier(new MongoDialect(), conn, this.logger);
    }
    return this.querier;
  }

  async end() {
    await this.querier.conn.close();
    delete this.querier;
  }
}
