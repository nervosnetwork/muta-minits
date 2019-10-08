// References:
// [0] https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
// [1] https://github.com/microsoft/TypeScript/blob/master/doc/spec.md

import commander from 'commander';
import Debug from 'debug';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import LLVMCodeGen from './codegen';
import * as prepare from './prepare';

const debug = Debug('minits');
const program = new commander.Command();

program.version('v0.0.1');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .option('-o, --output <output>', 'place the output into <file>')
  .option('-t, --triple <triple>', 'LLVM triple')
  .action((args, opts) => {
    const codeText = build(args, opts);
    if (opts.output) {
      fs.writeFileSync(opts.output, codeText);
    } else {
      process.stdout.write(codeText);
    }
  });

program
  .command('run <file>')
  .description('compile and run ts program')
  .action((args, opts) => run(args, opts));

program.parse(process.argv);

function build(args: any, opts: any): string {
  const fileName = args;

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  const rootDir = path.dirname(fileName);
  const files = prepare.getDependency(fileName);
  const tsProgram = ts.createProgram(files, {});

  const depends = new prepare.PrepareDepends(tsProgram);
  const dep = depends.genDepends(fileName);

  const cg = new LLVMCodeGen(rootDir, tsProgram, dep);
  const triple: string = opts.triple ? opts.triple : llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
  const target = llvm.TargetRegistry.lookupTarget(triple);
  const m = target.createTargetMachine(triple, 'generic');
  cg.module.dataLayout = m.createDataLayout();
  cg.module.targetTriple = triple;
  cg.module.sourceFileName = fileName;
  cg.genSourceFile(fileName);

  const codeText = cg.genText();
  debug(`
    ${codeText}
  `);
  llvm.verifyModule(cg.module);
  return codeText;
}

function run(args: any, opts: any): void {
  const codeText = build(args, opts);
  const tempFile = path.join(shell.tempdir(), 'minits.ll');

  fs.writeFileSync(tempFile, codeText);
  const execResp = shell.exec(`lli ${tempFile}`, {
    async: false
  });
  process.exit(execResp.code);
}
