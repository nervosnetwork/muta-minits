import test from 'ava';
import shell from 'shelljs';
import { compileToLLVMIR } from './util';

const srcArgsFromShell = `
function main(argc: number, argv: string[]): number {
  console.log('%s\\n', argv[1]);
  console.log('%s\\n', argv[2]);
  console.log('%d\\n', argc);
  return 0;
}
`;

test('test args', async t => {
  const irPath = await compileToLLVMIR(srcArgsFromShell);
  const name = irPath.slice(0, irPath.length - 3);

  shell.exec(`llvm-as ${name}.ll -o ${name}.bc`, { async: false });
  shell.exec(`llc -filetype=obj ${name}.bc -o ${name}.o`, { async: false });
  shell.exec(`gcc ${name}.o -o ${name}`, { async: false });
  const ret = shell.exec(`${name} foo bar`, { async: false });
  t.log(ret.stdout);
  t.pass();
});
