import { Query, QueryStringified } from '../type';

export function buildQuery<T>(qmsSrc: QueryStringified) {
  const qm: Query<T> = {};
  if (qmsSrc) {
    if (qmsSrc.skip) {
      qm.skip = Number(qmsSrc.skip);
    }
    if (qmsSrc.limit) {
      qm.limit = Number(qmsSrc.limit);
    }
    if (qmsSrc.project) {
      qm.project = JSON.parse(qmsSrc.project);
    }
    if (qmsSrc.filter) {
      qm.filter = JSON.parse(qmsSrc.filter);
    }
    if (qmsSrc.populate) {
      qm.populate = JSON.parse(qmsSrc.populate);
    }
    if (qmsSrc.sort) {
      qm.sort = JSON.parse(qmsSrc.sort);
    }
  }
  return qm;
}

function stringifyQueryParameter(key: string, value: any) {
  if (typeof value === 'object' && value !== null) {
    return `${key}=${JSON.stringify(value)}`;
  }
  return `${key}=${value}`;
}

export function stringifyQuery(qm: Query<any>): string {
  if (!qm) {
    return '';
  }
  const qsArr = Object.keys(qm).map((key) => stringifyQueryParameter(key, qm[key]));
  return qsArr.length ? `?${qsArr.join('&')}` : '';
}

export function stringifyQueryFilter(value: any) {
  return stringifyQueryParameter('?filter', value);
}
