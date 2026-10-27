import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffJson } from '../src/index.js';
const cli = (...args) => spawnSync(process.execPath, ['bin/cli.js', ...args], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
test('ordem das propriedades não cria diferença', () => {
  assert.deepEqual(diffJson({ a: 1, b: 2 }, { b: 2, a: 1 }), []);
});
test('adiciona, remove e altera campos', () => {
  assert.deepEqual(diffJson({ x: 1, old: true }, { x: 2, new: null }), [
    { type: 'added', path: '/new', after: null },
    { type: 'removed', path: '/old', before: true },
    { type: 'changed', path: '/x', before: 1, after: 2 },
  ]);
});
test('distingue null, objeto e array e identifica raiz', () => {
  assert.equal(diffJson(null, {})[0].path, '');
  assert.equal(diffJson([], {})[0].type, 'changed');
  assert.equal(diffJson(1, '1')[0].type, 'changed');
});
test('arrays são comparados por índice', () => {
  assert.deepEqual(diffJson([1, 2], [1]), [{ type: 'removed', path: '/1', before: 2 }]);
  assert.deepEqual(diffJson([], [1]), [{ type: 'added', path: '/0', after: 1 }]);
});
test('escapa caminhos e aceita propriedades especiais sem alterar protótipos', () => {
  const a = JSON.parse('{"__proto__":{"x":1},"a/b~c":0}');
  const b = JSON.parse('{"__proto__":{"x":2},"a/b~c":1}');
  const result = diffJson(a, b);
  assert.equal(result[0].path, '/__proto__/x');
  assert.equal(result[1].path, '/a~1b~0c');
  assert.equal({}.x, undefined);
  assert.equal(a.__proto__.x, 1);
});
test('limita profundidade em entradas muito aninhadas', () => {
  let a = 1, b = 2;
  for (let i = 0; i < 205; i++) { a = { a }; b = { a: b }; }
  assert.throws(() => diffJson(a, b), RangeError);
});
test('CLI JSON e --check distinguem sucesso, diferenças e erro', () => {
  const result = cli('examples/antes.json', 'examples/depois.json', '--json');
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).length, 3);
  assert.equal(cli('examples/antes.json', 'examples/depois.json', '--check').status, 1);
  assert.equal(cli('examples/antes.json', 'examples/antes.json', '--check').status, 0);
  assert.equal(cli('--help').status, 0);
  assert.equal(cli('ausente.json', 'ausente.json').status, 2);
  assert.equal(cli().status, 2);
});
test('CLI informa JSON inválido e aceita BOM UTF-8', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'json-delta-'));
  try {
    const invalid = join(dir, 'invalid.json'), valid = join(dir, 'valid.json');
    await writeFile(invalid, '{'); await writeFile(valid, '\uFEFF{}');
    assert.equal(cli(invalid, valid).status, 2);
    assert.equal(cli(valid, valid).status, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
