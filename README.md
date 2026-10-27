# JSON Delta CLI

Compare dois arquivos JSON e veja quais campos foram adicionados, removidos ou alterados.

## Funcionalidades

- Compara objetos aninhados e arrays por índice.
- Ignora a ordem das propriedades dos objetos.
- Caminhos escapados no formato JSON Pointer; a raiz usa a string vazia `""`.
- Saída legível ou JSON e modo `--check` para scripts.
- Apenas lê os arquivos; não modifica os documentos.

## Rodar

Requer Node.js 22 ou superior. Sem dependências externas ou build.

```bash
npm start -- examples/antes.json examples/depois.json
npm start -- examples/antes.json examples/depois.json --json
node bin/cli.js examples/antes.json examples/depois.json --check
npm test
```

O último comando de comparação retorna código 1 porque os exemplos têm diferenças. Isso é esperado.

## Códigos de saída

| Código | Significado |
| --- | --- |
| 0 | Comparação concluída; sem `--check`, diferenças também retornam 0 |
| 1 | Há diferenças e `--check` está ativo |
| 2 | Erro de argumento, leitura ou conteúdo JSON |

`node bin/cli.js --help` exibe ajuda.

## Exemplo de mudança

```json
{"type":"changed","path":"/theme","before":"light","after":"dark"}
```

Os campos `before` e `after` são omitidos quando não se aplicam. Na saída legível, `undefined` indica campo ausente, não um valor JSON. Um nome `a/b~c` vira `/a~1b~0c` no caminho.

## API JavaScript/TypeScript

```js
import { diffJson } from './src/index.js';
console.log(diffJson({ theme: 'light' }, { theme: 'dark' }));
```

A API recebe valores vindos de `JSON.parse`, sem ciclos. Tipos em `src/index.d.ts`.

## Limites

O resultado é um relatório, não um JSON Patch executável. Arrays são comparados por índice, sem detectar movimentações. A saída ordena chaves lexicograficamente para ser determinística. Números seguem a precisão do `JSON.parse` do JavaScript; não use esta ferramenta para comparar inteiros enormes com precisão arbitrária. Os arquivos são lidos em memória, e o limite de recursão é de 200 níveis.

## Estrutura

- `src/`: comparação e tipos.
- `bin/cli.js`: leitura dos arquivos e códigos de saída.
- `test/`: casos aninhados, propriedades especiais, arrays e CLI.
- `examples/`: documentos para experimentar.

## Ideias para evoluir

Filtros de caminhos e relatório HTML. Essas funcionalidades ainda não estão implementadas.

## Licença

MIT. Veja `LICENSE`.
