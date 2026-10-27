export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface Change {
  type: 'added' | 'removed' | 'changed';
  path: string;
  before?: JsonValue;
  after?: JsonValue;
}
export function diffJson(before: JsonValue, after: JsonValue): Change[];
