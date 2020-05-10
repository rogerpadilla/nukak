import * as mongoose from 'mongoose';
import { QuerierPool, QuerierPoolOptions } from '../type';
import { MongooseQuerier } from './mongooseQuerier';

export default class MongooseQuerierPool implements QuerierPool {
  constructor(protected readonly opts: QuerierPoolOptions) {}

  async getQuerier() {
    const uri = `mongodb://${this.opts.host}${this.opts.port ? ':' + this.opts.port : ''}/${this.opts.database}`;
    const conn = await mongoose.connect(uri, { useNewUrlParser: true });
    return new MongooseQuerier(conn);
  }
}
