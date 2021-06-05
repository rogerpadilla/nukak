import 'reflect-metadata';
import { hasKeys, lowerFirst, objectKeys, upperFirst } from '../../util';
import {
  RelationOptions,
  PropertyOptions,
  EntityOptions,
  EntityMeta,
  Type,
  KeyMapper,
  RelationMappedBy,
  KeyMap,
  ReferenceOptions,
} from '../../type';

const holder = globalThis;
const metaKey = '@uql/core/entity';
const metas: Map<Type<any>, EntityMeta<any>> = holder[metaKey] ?? new Map();
holder[metaKey] = metas;

export function defineProperty<E>(entity: Type<E>, prop: string, opts: PropertyOptions = {}): EntityMeta<E> {
  const meta = ensureMeta(entity);
  if (!opts.type) {
    const type = inferType(entity, prop);
    opts = { ...opts, type };
  }
  if (typeof opts.reference === 'function') {
    opts = { ...opts, reference: { entity: opts.reference } };
  }
  meta.properties[prop] = { ...meta.properties[prop], ...{ name: prop, ...opts } };
  return meta;
}

export function defineId<E>(entity: Type<E>, prop: string, opts: PropertyOptions): EntityMeta<E> {
  const meta = ensureMeta(entity);
  const id = getId(meta);
  if (id) {
    throw new TypeError(`'${entity.name}' must have a single field decorated with @Id`);
  }
  return defineProperty(entity, prop, { ...opts, isId: true });
}

export function defineRelation<E>(entity: Type<E>, prop: string, opts: RelationOptions<E>): EntityMeta<E> {
  if (!opts.entity) {
    const inferredType = inferEntityType(entity, prop);
    opts.entity = () => inferredType;
  }
  const meta = ensureMeta(entity);
  meta.relations[prop] = { ...meta.relations[prop], ...opts };
  return meta;
}

export function defineEntity<E>(entity: Type<E>, opts: EntityOptions = {}): EntityMeta<E> {
  const meta = ensureMeta(entity);

  if (!hasKeys(meta.properties)) {
    throw new TypeError(`'${entity.name}' must have properties`);
  }

  meta.name = opts.name ?? entity.name;
  let parentProto: object = Object.getPrototypeOf(entity.prototype);

  while (parentProto.constructor !== Object) {
    const parentMeta = ensureMeta(parentProto.constructor as Type<E>);
    extend(parentMeta, meta);
    parentProto = Object.getPrototypeOf(parentProto);
  }

  const id = getId(meta);
  if (!id) {
    throw new TypeError(`'${entity.name}' must have one field decorated with @Id`);
  }
  meta.id = { ...meta.properties[id], property: id };

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
  meta = { entity: entity, name: entity.name, properties: {}, relations: {} };
  metas.set(entity, meta);
  return meta;
}

export function getMeta<E>(entity: Type<E>): EntityMeta<E> {
  const meta = metas.get(entity);
  if (!meta) {
    throw new TypeError(`'${entity.name}' is not an entity`);
  }
  if (meta.processed) {
    return meta;
  }
  meta.processed = true;
  return fillRelations(meta);
}

function fillRelations<E>(meta: EntityMeta<E>): EntityMeta<E> {
  for (const relKey in meta.relations) {
    const relOpts = meta.relations[relKey];

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
      const source = lowerFirst(meta.name) + upperFirst(meta.id.name);
      const target = lowerFirst(relMeta.name) + upperFirst(relMeta.id.name);
      relOpts.references = [
        { source, target: meta.id.name },
        { source: target, target: relMeta.id.name },
      ];
    } else {
      const idSuffix = upperFirst(meta.id.property);
      relOpts.references = [{ source: relKey + idSuffix, target: relMeta.id.property }];
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
  const mappedByKey = getMappedByKey(relOpts);
  relOpts.mappedBy = mappedByKey as RelationMappedBy<E>;

  if (relMeta.relations[mappedByKey]) {
    const { cardinality, references, through } = relMeta.relations[mappedByKey];
    if (cardinality === '11' || cardinality === 'm1') {
      // invert here makes the SQL generation simpler (no need to check for `mappedBy`)
      relOpts.references = references.map(({ source, target }) => ({
        source: target,
        target: source,
      }));
    } else {
      relOpts.references = references;
      relOpts.through = through;
    }
  } else {
    relOpts.references = [{ source: mappedByKey, target: relMeta.id.property }];
  }
}

function fillThroughRelations<E>(entity: Type<E>): void {
  const meta = ensureMeta(entity);
  meta.relations = objectKeys(meta.properties).reduce((relations, propKey) => {
    const { reference } = meta.properties[propKey];
    if (reference) {
      const relEntityGetter = (reference as ReferenceOptions).entity;
      const relEntity = relEntityGetter();
      const relMeta = ensureMeta(relEntity);
      const relKey = propKey.slice(0, -relMeta.id.property.length);
      const relOpts: RelationOptions = {
        cardinality: 'm1',
        entity: relEntityGetter,
        references: [{ source: propKey, target: relMeta.id.property }],
      };
      relations[relKey] = relOpts;
    }
    return relations;
  }, {});
}

function getMappedByKey<E>(relOpts: RelationOptions<E>): string {
  if (typeof relOpts.mappedBy === 'function') {
    const relEntity = relOpts.entity();
    const relMeta = ensureMeta(relEntity);
    const keyMap = getKeyMap(relMeta);
    const mapper = relOpts.mappedBy as KeyMapper<E>;
    return mapper(keyMap);
  }
  return relOpts.mappedBy as string;
}

function getKeyMap<E>(meta: EntityMeta<E>): KeyMap<E> {
  return objectKeys({ ...meta.properties, ...meta.relations }).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as KeyMap<E>);
}

function getId<E>(meta: EntityMeta<E>): string {
  return objectKeys(meta.properties).find((attribute) => meta.properties[attribute]?.isId);
}

function extend<E>(source: EntityMeta<E>, target: EntityMeta<E>) {
  const sourceProperties = { ...source.properties };
  const targetId = getId(target);
  if (targetId) {
    const sourceId = getId(source);
    if (sourceId) {
      delete sourceProperties[sourceId];
    }
  }
  target.properties = { ...sourceProperties, ...target.properties };
  target.relations = { ...source.relations, ...target.relations };
}

function inferType<E>(entity: Type<E>, prop: string): any {
  return Reflect.getMetadata('design:type', entity.prototype, prop);
}

function inferEntityType<E>(entity: Type<E>, prop: string): Type<any> {
  const inferredType = inferType(entity, prop);
  const isValidType = isValidEntityType(inferredType);
  if (!isValidType) {
    throw new TypeError(`'${entity.name}.${prop}' type was auto-inferred with invalid type '${inferredType?.name}'`);
  }
  return inferredType;
}

function isValidEntityType(type: any): type is Type<any> {
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
