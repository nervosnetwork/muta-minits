import test from 'ava';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from '../codegen';
import Prelude from '../prelude';

async function runCode(source: string): Promise<boolean> {
  const jsRet = await runWithNodeJS(source);
  const irRet = await runWithLLVM(source);
  if (jsRet !== irRet.code && 256 + jsRet !== irRet.code) {
    return false;
  }
  if (irRet.stderr) {
    return false;
  }
  return true;
}

async function runWithNodeJS(source: string): Promise<any> {
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2015 } });
  return eval(`${result.outputText}; main();`);
}

async function runWithLLVM(source: string): Promise<any> {
  const hash = crypto
    .createHash('md5')
    .update(source)
    .digest()
    .toString('hex');

  fs.mkdirSync(path.join(shell.tempdir(), 'minits'), { recursive: true });
  const name = path.join(shell.tempdir(), 'minits', hash + '.ts');
  fs.writeFileSync(name, source);

  const prelude = new Prelude(name);
  const outputs = prelude.process();
  const codegen = new LLVMCodeGen(outputs);
  codegen.genSourceFile(outputs);

  const tmppath = path.join(path.dirname(outputs), 'output.ll');
  fs.writeFileSync(tmppath, codegen.genText());
  return shell.exec(`lli ${tmppath}`, { async: false });
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
