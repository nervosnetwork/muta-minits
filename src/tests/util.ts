import test from 'ava';
import crypto from 'crypto';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from '../codegen';
import Prelude from '../prelude';

export async function runCode(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<boolean> {
  const jsRet = await compileToJS(source, options);
  const irPath = await compileToLLVMIR(source);
  const llvmRet = shell.exec(`lli ${irPath}`, { async: false });
  if (jsRet !== llvmRet.code && 256 + jsRet !== llvmRet.code) {
    return false;
  }
  if (llvmRet.stderr) {
    return false;
  }
  return true;
}

export function runTest(name: string, code: string): void {
  test(name, async t => {
    if (await runCode(code)) {
      t.pass();
    } else {
      t.fail();
    }
  });
}

async function compileToJS(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<any> {
  const result = ts.transpileModule(source, options);
  return eval(`
    ${result.outputText}
    main();
  `);
}

export async function compileToLLVMIR(source: string): Promise<string> {
  const hash = crypto
    .createHash('md5')
    .update(source)
    .digest()
    .toString('hex');

  fs.mkdirSync(path.join(shell.tempdir(), 'minits'), { recursive: true });
  const name = path.join(shell.tempdir(), 'minits', hash + '.ts');
  fs.writeFileSync(name, source);

  const prelude = new Prelude(name);
  prelude.process();

  const fullFile = [prelude.main, ...prelude.depends]
    .map(e => path.relative(prelude.rootdir, e))
    .map(e => path.join(prelude.tempdir, e));
  const mainFile = fullFile[0];

  const program = ts.createProgram(fullFile, {});
  const cgen = new LLVMCodeGen(prelude.tempdir, program);
  cgen.genSourceFile(mainFile);
  llvm.verifyModule(cgen.module);

  const output = path.join(prelude.tempdir, 'output.ll');
  fs.writeFileSync(output, cgen.genText());
  return output;
}
