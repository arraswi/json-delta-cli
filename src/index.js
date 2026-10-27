/**
 * @typedef {null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }} JsonValue
 * @typedef {{ type: 'added'|'removed'|'changed', path: string, before?: JsonValue, after?: JsonValue }} Change
 */
/**
 * Compare values produced by JSON.parse. Paths use JSON Pointer escaping.
 * Arrays are compared by index. This report is not an executable JSON Patch.
 * @param {JsonValue} before
 * @param {JsonValue} after
 * @returns {Change[]}
 */
export function diffJson(before, after) {
  const changes = [];
  const escape = value => String(value).replaceAll('~', '~0').replaceAll('/', '~1');
  const object = value => value !== null && typeof value === 'object';
  function visit(a, b, path, depth) {
    if (depth > 200) throw new RangeError('JSON profundo demais: limite de 200 níveis.');
    if (a === b) return;
    if (!object(a) || !object(b) || Array.isArray(a) !== Array.isArray(b)) {
      changes.push({ type: 'changed', path, before: a, after: b }); return;
    }
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const key of keys) {
      const next = `${path}/${escape(key)}`;
      if (!Object.hasOwn(a, key)) changes.push({ type: 'added', path: next, after: b[key] });
      else if (!Object.hasOwn(b, key)) changes.push({ type: 'removed', path: next, before: a[key] });
      else visit(a[key], b[key], next, depth + 1);
    }
  }
  visit(before, after, '', 0);
  return changes;
}
