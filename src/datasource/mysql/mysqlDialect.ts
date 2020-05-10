import { escape, escapeId } from 'sqlstring';
import { SqlDialect } from '../sqlDialect';
import { QueryTextSearchProperties, QueryComparisonValue } from '../../type';

export class MySqlDialect extends SqlDialect {
  readonly beginTransactionCommand = 'START TRANSACTION';

  comparison<T>(key: string, val: QueryComparisonValue<T>) {
    switch (key) {
      case '$text':
        const props = val as QueryTextSearchProperties<T>;
        const fields = escapeId(props.fields);
        return `MATCH(${fields}) AGAINST(${escape(props.value)})`;
      default:
        return super.comparison(key, val);
    }
  }
}
