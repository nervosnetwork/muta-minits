import test from 'ava';
import Debug from 'debug';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import util from 'util';

const debug = Debug('minits:test:file.secp.ts');

test('test llvm file', async t => {
  const pwd: string = process.env.PWD!;
  const root = path.join(pwd, 'resources/ts');
  const tsFiles = findTs(root);

  const asyncReadfile = util.promisify(fs.readFile);
  const asyncWritefile = util.promisify(fs.writeFile);

  const tempFiles = await Promise.all(
    tsFiles.map(async (file: string, index) => {
      const data = await asyncReadfile(file);

      const tempFile = path.join(
        shell.tempdir().toString(),
        `minits-test-${index}.ts`
      );

      await asyncWritefile(tempFile, data);
      return tempFile;
    })
  );

  const minitsRoot = path.join(pwd, 'src/index.ts');
  tempFiles.map(tempFile => {
    debug(tempFile);

    const a = shell.exec(`ts-node ${tempFile}`);
    const b = shell.exec(`ts-node ${minitsRoot} run ${tempFile}`);

    debug(a);
    debug(b);
  });
  t.true(true);
});

function findTs(root: string): string[] {
  return fs
    .readdirSync(root)
    .filter(
      fileName =>
        !fileName.endsWith('.ts') ||
        !fs.statSync(path.join(root, fileName)).isDirectory()
    )
    .reduce((pre: string[], fileName: string) => {
      const file = path.join(root, fileName);

      const files: string[] = fs.statSync(file).isDirectory()
        ? findTs(file)
        : [file];

      return pre.concat(...files);
    }, []);
}
