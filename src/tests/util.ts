import crypto from 'crypto';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from '../codegen';
import { PrepareDepends, PrepareImpot } from '../prepare';

export async function runCode(
  source: string,
  options: ts.TranspileOptions = { compilerOptions: { module: ts.ModuleKind.ES2015 } }
): Promise<void> {
  const jsRet = await compileToJS(source, options);
  const irPath = await compileToLLVMIR(source);
  const llvmRet = shell.exec(`lli ${irPath}`, {
    async: false
  });
  if (jsRet !== llvmRet.code) {
    throw new Error(`The results don't match, js ${jsRet} llvm ${llvmRet.code}`);
  }

  if (llvmRet.stderr) {
    throw new Error(llvmRet.stderr);
  }
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
  const tempTSFile = path.join(shell.tempdir(), `${tmpFileName}.ts`);
  fs.writeFileSync(tempTSFile, source);

  const preImport = new PrepareImpot(tempTSFile);
  const rootDir = preImport.getRoot();
  const files = preImport.getImportFiles();
  const tsProgram = ts.createProgram(files, {});
  const depends = new PrepareDepends(tsProgram);
  const dep = depends.genDepends(tempTSFile);

  const cgen = new LLVMCodeGen(rootDir, tsProgram, dep);
  cgen.genSourceFile(tempTSFile);
  llvm.verifyModule(cgen.module);

  const tempFile = path.join(shell.tempdir(), `${tmpFileName}.ll`);
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
