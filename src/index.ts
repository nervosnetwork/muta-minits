// References:
// [0] https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
// [1] https://github.com/microsoft/TypeScript/blob/master/doc/spec.md

import child_process from 'child_process';
import commander from 'commander';
import fs from 'fs';
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './llvm-codegen';

const program = new commander.Command();

program
  .version('v0.0.1')
  .option(
    '-o, --output <output>',
    'place the output into <file>',
    '/tmp/minits.ll' // default
  )
  .option('-t, --triple <triple>', 'LLVM triple');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .action(build);

program
  .command('run <file>')
  .description('compile and run ts program')
  .action(run);

program.parse(process.argv);

function build(cm: commander.Command): void {
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

  if (cm.output) {
    fs.writeFileSync(cm.output, cg.genText());
  } else {
    process.stdout.write(cg.genText());
  }
  llvm.verifyModule(cg.module);
}

function run(cm: commander.Command): void {
  build(cm);
  const p = child_process.spawn('lli', [cm.output]);

  p.stdout.on('data', process.stdout.write);
  p.stderr.on('data', process.stderr.write);
  p.on('close', process.exit);
}
