import crypto from 'crypto';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from '../codegen';
import * as prepare from '../prepare';

export async function runCode(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<boolean> {
  const jsRet = await compileToJS(source, options);
  const irPath = await compileToLLVMIR(source);
  const llvmRet = shell.exec(`lli ${irPath}`, { async: false });
  if (jsRet !== llvmRet.code) {
    return false;
  }
  if (llvmRet.stderr) {
    return false;
  }
  return true;
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
  const tmpFileName = sourceToHash(source);
  const rootDir = shell.tempdir();
  const tempTSFile = path.join(rootDir, `${tmpFileName}.ts`);
  fs.writeFileSync(tempTSFile, source);

  const files = prepare.getDependency(tempTSFile);
  const tsProgram = ts.createProgram(files, {});
  const depends = new prepare.PrepareDepends(tsProgram);
  const dep = depends.genDepends(tempTSFile);

  const cgen = new LLVMCodeGen(rootDir, tsProgram, dep);
  cgen.genSourceFile(tempTSFile);
  llvm.verifyModule(cgen.module);

  const tempFile = path.join(rootDir, `${tmpFileName}.ll`);
  fs.writeFileSync(tempFile, cgen.genText());
  return tempFile;
}

function sourceToHash(str: string): string {
  return crypto
    .createHash('sha256')
    .update(str)
    .digest()
    .toString('hex');
}
