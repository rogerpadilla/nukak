import { SqlDialect } from '../sqlDialect';

export class MySqlDialect extends SqlDialect {
  get beginTransactionCommand() {
    return 'START TRANSACTION';
  }
}
