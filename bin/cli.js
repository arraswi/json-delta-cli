#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { diffJson } from '../src/index.js';
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    json: { type: 'boolean' }, check: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) console.log('Uso: node bin/cli.js antes.json depois.json [--json] [--check]\nSaída: 0 sucesso, 1 diferenças com --check, 2 erro de uso/leitura/JSON.');
  else {
    if (positionals.length !== 2) throw new Error('Informe exatamente dois arquivos JSON.');
    const [a, b] = await Promise.all(positionals.map(async file => {
      const text = await readFile(file, 'utf8');
      try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
      catch { throw new Error(`JSON inválido em ${file}.`); }
    }));
    const changes = diffJson(a, b);
    if (values.json) console.log(JSON.stringify(changes, null, 2));
    else if (!changes.length) console.log('Nenhuma diferença encontrada.');
    else for (const change of changes) {
      // Stringify paths to keep control characters from corrupting terminal output.
      console.log(`${change.type} ${JSON.stringify(change.path)}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`);
    }
    if (values.check && changes.length) process.exitCode = 1;
  }
} catch (error) { console.error('Erro: ' + error.message); process.exitCode = 2; }
