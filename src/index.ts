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

const debug = Debug('minits');
const program = new commander.Command();

program.version('v0.0.1');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .option('-o, --output <output>', 'place the output into <file>')
  .option('-t, --triple <triple>', 'LLVM triple')
  .action(args => {
    const codeText = build(args);

    if (program.opts().output) {
      fs.writeFileSync(program.opts().output, codeText);
    } else {
      process.stdout.write(codeText);
    }
  });

program
  .command('run <file>')
  .description('compile and run ts program')
  .action(args => run(args));

program.parse(process.argv);

function build(...args: readonly any[]): string {
  const fileName = args[args.length - 1];
  const sourceFile = ts.createSourceFile(
    fileName,
    fs.readFileSync(fileName).toString(),
    ts.ScriptTarget.ES2020,
    true
  );

  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  const cg = new LLVMCodeGen();
  cg.genSourceFile(sourceFile);

  const triple: string = program.opts().triple
    ? program.opts().triple
    : llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
  const target = llvm.TargetRegistry.lookupTarget(triple);
  const m = target.createTargetMachine(triple, 'generic');
  cg.module.dataLayout = m.createDataLayout();
  cg.module.targetTriple = triple;

  const codeText = cg.genText();
  debug(`
    ${codeText}
  `);
  llvm.verifyModule(cg.module);
  return codeText;
}

function run(...args: readonly any[]): void {
  const codeText = build(...args);
  const tempFile = path.join(shell.tempdir(), 'minits.ll');

  fs.writeFileSync(tempFile, codeText);
  const execResp = shell.exec(`lli ${tempFile}`, {
    async: false
  });

  if (execResp.stderr) {
    process.stderr.write(execResp.toString());
  } else {
    process.stdout.write(execResp.toString());
  }

  process.exit(execResp.code);
}
