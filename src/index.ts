// References:
// [0] https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
// [1] https://github.com/microsoft/TypeScript/blob/master/doc/spec.md

import * as child_process from 'child_process';
import argv from 'commander';
import * as fs from 'fs';
import * as llvm from 'llvm-node';
import * as ts from 'typescript';

import * as codegen from './codegen';

const help = `usage: minits <command> [<args>]
The most commonly used daze commands are:
  build     compile packages and dependencies
  run       compile and run ts program

Run 'minits <command> -h' for more information on a command.`;

argv.option('-o, --output <output>', 'place the output into <file>');
argv.option('--triple <triple>', 'LLVM triple');
argv.parse(process.argv);

function mainBuild(): void {
  const fileName = argv.args[argv.args.length - 1];
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

  const cg = new codegen.LLVMCodeGen();
  cg.genSourceFile(sourceFile);

  const triple: string = argv.triple
    ? argv.triple
    : llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
  const target = llvm.TargetRegistry.lookupTarget(triple);
  const m = target.createTargetMachine(triple, 'generic');
  cg.module.dataLayout = m.createDataLayout();
  cg.module.targetTriple = triple;

  if (argv.output) {
    fs.writeFileSync(argv.output, cg.genText());
  } else {
    process.stdout.write(cg.genText());
  }
  llvm.verifyModule(cg.module);
}

function mainRun(): void {
  if (typeof argv.output === 'undefined') {
    argv.output = '/tmp/minits.ll';
  }
  mainBuild();
  const p = child_process.spawn('lli', [argv.output]);
  p.stdout.on('data', data => {
    process.stdout.write(data);
  });
  p.stderr.on('data', data => {
    process.stderr.write(data);
  });
  p.on('close', code => {
    process.exit(code);
  });
}

function main(): void {
  switch (argv.args[0]) {
    case 'build':
      mainBuild();
      break;
    case 'run':
      mainRun();
      break;
    default:
      process.stdout.write(help);
      break;
  }
}

main();
