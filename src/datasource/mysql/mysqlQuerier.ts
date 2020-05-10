import { QuerierPoolConnection } from '../type';
import { SqlQuerier } from '../sqlQuerier';
import { MySqlDialect } from './mysqlDialect';

export class MySqlQuerier extends SqlQuerier {
  constructor(protected readonly conn: QuerierPoolConnection) {
    super(new MySqlDialect(), conn);
  }

  async query<T>(sql: string): Promise<T> {
    console.debug(`\rquery: ${sql}\n`);
    const [resp] = await this.conn.query(sql);
    return resp;
  }
}
