import crypto from 'crypto';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from '../codegen';

export async function runCode(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<void> {
  const jsRet = await compileJS(source, options);
  const llvmRet = await compileLLVM(source);

  if (jsRet !== llvmRet.code) {
    throw new Error(`The results don't match, js ${jsRet} llvm ${llvmRet.code}`);
  }

  if (llvmRet.stderr) {
    throw new Error(llvmRet.stderr);
  }
}

async function compileJS(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<any> {
  const result = ts.transpileModule(source, options);
  return eval(`
    ${result.outputText}
    main();
  `);
}

async function compileLLVM(source: string): Promise<any> {
  const cgen = new LLVMCodeGen();
  const ast = ts.createSourceFile('', source, ts.ScriptTarget.ES2020, true);
  cgen.genSourceFile(ast);
  llvm.verifyModule(cgen.module);

  const tmpFileName = sourceToHash(source);
  const tempFile = path.join(shell.tempdir(), `${tmpFileName}.ll`);

  fs.writeFileSync(tempFile, cgen.genText());
  return shell.exec(`lli ${tempFile}`, {
    async: false
  });
}

function sourceToHash(str: string): string {
  return crypto
    .createHash('sha256')
    .update(str)
    .digest()
    .toString('hex');
}
