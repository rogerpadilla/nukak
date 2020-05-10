export type QueryPrimitive = string | number | boolean;

export type QueryFilter<T> = QueryFieldFilter<T> | QueryLogicalOperator<T>;

export type QueryFieldFilter<T> = {
  readonly [P in keyof T]: T[P] | string | QueryComparisonOperator;
};

export type QueryLogicalOperator<T> = {
  readonly $or?: QueryFieldFilter<T>;
};

export type QueryComparisonOperator = {
  readonly $ne?: QueryPrimitive;
  readonly $lt?: number;
  readonly $lte?: number;
  readonly $gt?: number;
  readonly $gte?: number;
  readonly $startsWith?: string;
  readonly $in?: QueryPrimitive[];
  readonly $nin?: QueryPrimitive[];
  readonly $match?: string;
};

export type QueryLimit = {
  skip?: number;
  limit?: number;
};

export type QueryPopulate<T> = {
  project?: QueryProject<T>;
  populate?: { [P in keyof T]: QueryPopulate<T[P]> };
};

export type QueryProject<T> = {
  readonly [P in keyof T]: 1 | 0;
};

export type QuerySort<T> = {
  readonly [P in keyof T]: 1 | -1;
};

export type QueryOne<T> = QueryPopulate<T> & {
  filter?: QueryFilter<T>;
};

export type Query<T> = QueryOne<T> & QueryLimit & { sort?: QuerySort<T> };

export type QueryStringified = {
  readonly [P in keyof Query<unknown>]?: any;
};

export type QueryUpdateResult = {
  readonly affectedRows?: number;
  readonly insertId?: number;
};

export type QueryOptions = { trustedProject?: boolean };
