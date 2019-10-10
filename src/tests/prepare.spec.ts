import test from 'ava';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';

import * as pretreat from '../pre-treatment';

const main = `
import a from './import-a'
import c from './import-b'
`;

const importA = `
import b from './import-b'
`;

const importB = `
import c from './import-c'
`;

const importC = `
console.log('c module')
`;

test('test prepare import', async t => {
  const mainFile = path.join(shell.tempdir(), `main.ts`);
  const aFile = path.join(shell.tempdir(), `import-a.ts`);
  const bFile = path.join(shell.tempdir(), `import-b.ts`);
  const cFile = path.join(shell.tempdir(), `import-c.ts`);

  fs.writeFileSync(mainFile, main);
  fs.writeFileSync(aFile, importA);
  fs.writeFileSync(bFile, importB);
  fs.writeFileSync(cFile, importC);
  const files = pretreat.getDependency(mainFile);
  t.assert(files.length === 4);

  const set = new Set(files);
  t.assert(set.has(mainFile));
  t.assert(set.has(aFile));
  t.assert(set.has(bFile));
  t.assert(set.has(cFile));
});
