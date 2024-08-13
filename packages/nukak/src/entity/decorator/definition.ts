import 'reflect-metadata';
import type {
  RelationOptions,
  FieldOptions,
  EntityOptions,
  EntityMeta,
  Type,
  RelationKeyMap,
  RelationKey,
  Key,
  FieldKey,
  IdKey,
} from '../../type/index.js';
import { hasKeys, lowerFirst, getKeys, upperFirst } from '../../util/index.js';

const holder = globalThis;
const metaKey = 'nukak/entity/decorator';
const metas: Map<Type<any>, EntityMeta<any>> = holder[metaKey] ?? new Map();
holder[metaKey] = metas;

export function defineField<E>(entity: Type<E>, key: string, opts: FieldOptions = {}): EntityMeta<E> {
  const meta = ensureMeta(entity);
  if (!opts.type) {
    const type = inferType(entity, key);
    opts = { ...opts, type };
  }
  meta.fields[key] = { ...meta.fields[key], ...{ name: key, ...opts } };
  return meta;
}

export function defineId<E>(entity: Type<E>, key: string, opts: FieldOptions): EntityMeta<E> {
  const meta = ensureMeta(entity);
  const id = getIdKey(meta);
  if (id) {
    console.info(`Overriding ID property for '${entity.name}' from '${id}' to '${key}'`);
    delete meta.fields[id];
  }
  return defineField(entity, key, { ...opts, isId: true });
}

export function defineRelation<E>(entity: Type<E>, key: string, opts: RelationOptions<E>): EntityMeta<E> {
  if (!opts.entity) {
    const inferredType = inferEntityType(entity, key);
    opts.entity = () => inferredType;
  }
  const meta = ensureMeta(entity);
  meta.relations[key] = { ...meta.relations[key], ...opts };
  return meta;
}

export function defineEntity<E>(entity: Type<E>, opts: EntityOptions = {}): EntityMeta<E> {
  const meta = ensureMeta(entity);

  if (!hasKeys(meta.fields)) {
    throw TypeError(`'${entity.name}' must have fields`);
  }

  const onDeleteKeys = getKeys(meta.fields).filter((key) => meta.fields[key].onDelete) as FieldKey<E>[];

  if (onDeleteKeys.length > 1) {
    throw TypeError(`'${entity.name}' must have one field with 'onDelete' as maximum`);
  }

  if (opts.softDelete) {
    if (!onDeleteKeys.length) {
      throw TypeError(`'${entity.name}' must have one field with 'onDelete' to enable 'softDelete'`);
    }
    meta.softDelete = onDeleteKeys[0];
  }

  meta.name = opts.name ?? entity.name;
  let proto: FunctionConstructor = Object.getPrototypeOf(entity.prototype);

  while (proto.constructor !== Object) {
    const parentMeta = ensureMeta(proto.constructor as Type<E>);
    extendMeta(meta, parentMeta);
    proto = Object.getPrototypeOf(proto);
  }

  const id = getIdKey(meta);
  if (!id) {
    throw TypeError(`'${entity.name}' must have one field decorated with @Id`);
  }
  meta.id = id;

  return meta;
}

export function getEntities(): Type<any>[] {
  return [...metas.entries()].reduce((acc, [key, val]) => {
    if (val.id) {
      acc.push(key);
    }
    return acc;
  }, []);
}

function ensureMeta<E>(entity: Type<E>): EntityMeta<E> {
  let meta = metas.get(entity);
  if (meta) {
    return meta;
  }
  meta = { entity, fields: {}, relations: {} };
  metas.set(entity, meta);
  return meta;
}

export function getMeta<E>(entity: Type<E>): EntityMeta<E> {
  const meta = metas.get(entity);
  if (!meta) {
    throw TypeError(`'${entity.name}' is not an entity`);
  }
  if (meta.processed) {
    return meta;
  }
  meta.processed = true;
  return fillRelations(meta);
}

function fillRelations<E>(meta: EntityMeta<E>): EntityMeta<E> {
  for (const relKey in meta.relations) {
    const relOpts = meta.relations[relKey as RelationKey<E>];

    if (relOpts.references) {
      // references were manually specified
      continue;
    }

    if (relOpts.mappedBy) {
      fillInverseSideRelations(relOpts);
      continue;
    }

    const relEntity = relOpts.entity();
    const relMeta = ensureMeta(relEntity);

    if (relOpts.cardinality === 'mm') {
      const idName = meta.fields[meta.id].name;
      const relIdName = relMeta.fields[relMeta.id].name;
      const source = lowerFirst(meta.name) + upperFirst(idName);
      const target = lowerFirst(relMeta.name) + upperFirst(relIdName);
      relOpts.references = [
        { local: source, foreign: meta.id },
        { local: target, foreign: relMeta.id },
      ];
    } else {
      relOpts.references = [{ local: `${relKey}Id`, foreign: relMeta.id }];
    }

    if (relOpts.through) {
      fillThroughRelations(relOpts.through());
    }
  }

  return meta;
}

function fillInverseSideRelations<E>(relOpts: RelationOptions<E>): void {
  const relEntity = relOpts.entity();
  const relMeta = getMeta(relEntity);
  relOpts.mappedBy = getMappedByRelationKey(relOpts);

  if (relMeta.fields[relOpts.mappedBy as FieldKey<E>]) {
    relOpts.references = [{ local: relMeta.id, foreign: relOpts.mappedBy }];
    return;
  }

  const mappedByRelation = relMeta.relations[relOpts.mappedBy as RelationKey<E>];

  if (relOpts.cardinality === 'm1' || relOpts.cardinality === 'mm') {
    relOpts.references = mappedByRelation.references.slice().reverse();
    relOpts.through = mappedByRelation.through;
    return;
  }

  relOpts.references = mappedByRelation.references.map(({ local, foreign }) => ({
    local: foreign,
    foreign: local,
  }));
}

function fillThroughRelations<E>(entity: Type<E>): void {
  const meta = ensureMeta(entity);
  meta.relations = getKeys(meta.fields).reduce((relations, key) => {
    const { reference } = meta.fields[key as FieldKey<E>];
    if (reference) {
      const relEntity = reference();
      const relMeta = ensureMeta(relEntity);
      const relKey = key.slice(0, -relMeta.id.length);
      const relOpts: RelationOptions = {
        entity: reference,
        cardinality: 'm1',
        references: [{ local: key, foreign: relMeta.id }],
      };
      relations[relKey] = relOpts;
    }
    return relations;
  }, {});
}

function getMappedByRelationKey<E>(relOpts: RelationOptions<E>): Key<E> {
  if (typeof relOpts.mappedBy === 'function') {
    const relEntity = relOpts.entity();
    const relMeta = ensureMeta(relEntity);
    const keyMap = getRelationKeyMap(relMeta);
    return relOpts.mappedBy(keyMap);
  }
  return relOpts.mappedBy;
}

function getRelationKeyMap<E>(meta: EntityMeta<E>): RelationKeyMap<E> {
  return getKeys(meta.fields)
    .concat(getKeys(meta.relations))
    .reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {} as RelationKeyMap<E>);
}

function getIdKey<E>(meta: EntityMeta<E>): IdKey<E> {
  const id = getKeys(meta.fields).find((key) => meta.fields[key]?.isId);
  return id as IdKey<E>;
}

function extendMeta<E>(target: EntityMeta<E>, source: EntityMeta<E>): void {
  const sourceFields = { ...source.fields };
  const targetId = getIdKey(target);
  if (targetId) {
    const sourceId = getIdKey(source);
    if (sourceId) {
      delete sourceFields[sourceId];
    }
  }
  target.fields = { ...sourceFields, ...target.fields };
  target.relations = { ...source.relations, ...target.relations };
}

function inferType<E>(entity: Type<E>, key: string): any {
  return Reflect.getMetadata('design:type', entity.prototype, key);
}

function inferEntityType<E>(entity: Type<E>, key: string): Type<any> {
  const inferredType = inferType(entity, key);
  const isValidType = isValidEntityType(inferredType);
  if (!isValidType) {
    throw TypeError(`'${entity.name}.${key}' type was auto-inferred with invalid type '${inferredType?.name}'`);
  }
  return inferredType;
}

export function isValidEntityType(type: any): type is Type<any> {
  return (
    typeof type === 'function' &&
    type !== Boolean &&
    type !== String &&
    type !== Number &&
    type !== BigInt &&
    type !== Date &&
    type !== Symbol &&
    type !== Object
  );
}
