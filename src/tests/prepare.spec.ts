import test from 'ava';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';

import { PrepareImpot } from '../prepare';

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
  const bFile = path.join(shell.tempdir(), `import-a.ts`);
  const cFile = path.join(shell.tempdir(), `import-a.ts`);

  fs.writeFileSync(mainFile, main);
  fs.writeFileSync(aFile, importA);
  fs.writeFileSync(bFile, importB);
  fs.writeFileSync(cFile, importC);

  const preImport = new PrepareImpot(mainFile);
  // [
  //   '/var/folders/v1/y82lbbsx7xz6_32ytzw9fvyw0000gn/T/main.ts',
  //   '/var/folders/v1/y82lbbsx7xz6_32ytzw9fvyw0000gn/T/import-a.ts',
  //   '/var/folders/v1/y82lbbsx7xz6_32ytzw9fvyw0000gn/T/import-b.ts',
  //   '/var/folders/v1/y82lbbsx7xz6_32ytzw9fvyw0000gn/T/import-c.ts',
  // ]
  const files = preImport.getImportFiles();

  t.log(files);
  t.assert(files.length === 4);

  const set = new Set(files);
  t.assert(set.has(mainFile));
  t.assert(set.has(aFile));
  t.assert(set.has(bFile));
  t.assert(set.has(cFile));
});
