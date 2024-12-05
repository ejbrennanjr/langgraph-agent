import { merge, pick, omit } from 'lodash';
import type { Dictionary } from 'lodash';

export function mergeObjects<T>(obj1: T, obj2: Partial<T>): T {
  return merge({}, obj1, obj2);
}

export function pickFields<T extends Dictionary<any>>(
  obj: T,
  fields: Array<keyof T>
): Partial<T> {
  return pick(obj, fields);
}