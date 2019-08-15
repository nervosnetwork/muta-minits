// References:
// [0] https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
// [1] https://github.com/microsoft/TypeScript/blob/master/doc/spec.md

import child_process from 'child_process';
import commander from 'commander';
import Debug from 'debug';
import fs from 'fs';
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './llvm-codegen';

const debug = Debug('minits');
const program = new commander.Command();

program.version('v0.0.1');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .option('-o, --output <output>', 'place the output into <file>')
  .option('-t, --triple <triple>', 'LLVM triple')
  .action(cm => {
    const codeText = build(cm);

    if (cm.output) {
      fs.writeFileSync(cm.output, codeText);
    } else {
      process.stdout.write(codeText);
    }
  });

program
  .command('run <file>')
  .description('compile and run ts program')
  .action(run);

program.parse(process.argv);

function build(cm: commander.Command): string {
  const fileName = cm.args[cm.args.length - 1];
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

  const triple: string = cm.triple
    ? cm.triple
    : llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
  const target = llvm.TargetRegistry.lookupTarget(triple);
  const m = target.createTargetMachine(triple, 'generic');
  cg.module.dataLayout = m.createDataLayout();
  cg.module.targetTriple = triple;

  const codeText = cg.genText();
  debug(codeText);
  llvm.verifyModule(cg.module);
  return codeText;
}

function run(cm: commander.Command): void {
  const codeText = build(cm);
  const p = child_process.spawn(`echo ${codeText} | lli`);

  p.stdout.on('data', process.stdout.write);
  p.stderr.on('data', process.stderr.write);
  p.on('close', process.exit);
}
