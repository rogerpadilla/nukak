import { RelationProperties, ColumnProperties, PrimaryColumnProperties } from './type';

const entitiesMeta = new Map<
  { new (): any },
  {
    id?: string;
    columns: {
      [p: string]: ColumnProperties;
    };
    relations: {
      [p: string]: RelationProperties;
    };
    merged?: boolean;
  }
>();

function ensureEntityMeta<T>(type: { new (): T }) {
  if (!entitiesMeta.has(type)) {
    entitiesMeta.set(type, { columns: {}, relations: {} });
  }
  return entitiesMeta.get(type);
}

export function defineColumn<T>(type: { new (): T }, prop: string, args: ColumnProperties) {
  ensureEntityMeta(type).columns[prop] = args;
}

export function definePrimaryColumn<T>(type: { new (): T }, prop: string, args: PrimaryColumnProperties) {
  defineColumn(type, prop, { mode: 'read', ...args });
  const meta = entitiesMeta.get(type);
  meta.id = prop;
}

export function defineRelation<T>(type: { new (): T }, prop: string, args: RelationProperties) {
  ensureEntityMeta(type).relations[prop] = args;
}

export function getEntityMeta<T>(type: { new (): T }) {
  const meta = ensureEntityMeta(type);
  if (meta.merged) {
    return meta;
  }
  let parentProto = Object.getPrototypeOf(type.prototype);
  while (parentProto.constructor !== Object) {
    const parentMeta = entitiesMeta.get(parentProto.constructor);
    meta.id = meta.id || parentMeta.id;
    meta.columns = { ...parentMeta.columns, ...meta.columns };
    meta.relations = { ...parentMeta.relations, ...meta.relations };
    parentProto = Object.getPrototypeOf(parentProto);
  }
  meta.merged = true;
  return meta;
}

export function getEntityId<T>(type: { new (): T }) {
  const meta = getEntityMeta(type);
  return meta.id;
}

export function getEntities() {
  return entitiesMeta.keys();
}
