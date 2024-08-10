export type Type<T> = new (...args: unknown[]) => T;

export type BooleanLike = boolean | 0 | 1;

export type MongoId = {
  toHexString: () => string;
};

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export type Scalar = string | number | boolean | bigint | Symbol | Date | RegExp | Buffer | MongoId;

export type ExpandScalar<T> = null | (T extends Date ? Date | string : T);

export type Writable<T> = { -readonly [K in keyof T]: T[K] };

export type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: unknown[]) => infer U
    ? U
    : T extends Promise<infer U>
      ? U
      : T;
