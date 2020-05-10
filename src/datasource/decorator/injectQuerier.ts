const metadataKey = Symbol('InjectQuerier');

export function InjectQuerier() {
  return (target: object, propertyKey: string, index: number) => {
    target[metadataKey] = {
      [propertyKey]: index,
    };
  };
}

export function getInjectQuerier<T>(target: object, propertyKey: string) {
  const index = target[metadataKey][propertyKey];
  return index;
}
