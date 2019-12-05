import test from 'ava';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';

import LLVMCodeGen from '../codegen';
import Prelude from '../prelude';

const srcArgsFromShell = `
function main(argc: number, argv: string[]): number {
  console.log('%s\\n', argv[1]);
  console.log('%s\\n', argv[2]);
  console.log('%d\\n', argc);
  return 0;
}
`;

test('test args', async t => {
  const hash = crypto
    .createHash('md5')
    .update(srcArgsFromShell)
    .digest()
    .toString('hex');

  fs.mkdirSync(path.join(shell.tempdir(), 'minits'), { recursive: true });
  const name = path.join(shell.tempdir(), 'minits', hash + '.ts');
  fs.writeFileSync(name, srcArgsFromShell);

  const prelude = new Prelude(name);
  const outputs = prelude.process();
  const codegen = new LLVMCodeGen(outputs);
  codegen.genSourceFile(outputs);

  const full = path.join(path.dirname(outputs), 'output');
  fs.writeFileSync(`${full}.ll`, codegen.genText());
  shell.exec(`llvm-as ${full}.ll -o ${full}.bc`, { async: false });
  shell.exec(`llc -filetype=obj ${full}.bc -o ${full}.o`, { async: false });
  shell.exec(`gcc ${full}.o -o ${full}`, { async: false });
  const ret = shell.exec(`${full} foo bar`, { async: false });
  t.log(ret.stdout);
  if (ret.code === 0) {
    t.pass();
  } else {
    t.fail();
  }
});
