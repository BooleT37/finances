import objectHash, { type BaseOptions, type NotUndefined } from 'object-hash';

export const hash = (obj: NotUndefined, options?: BaseOptions) =>
  objectHash(obj, options);
