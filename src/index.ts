// References:
// [0] https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
// [1] https://github.com/microsoft/TypeScript/blob/master/doc/spec.md

process.env.DEBUG_COLORS = '0';
process.env.DEBUG_HIDE_DATE = '1';
process.env.DEBUG = 'minits*';

import commander from 'commander';
import fs from 'fs';
import llvm from 'llvm-node';
import path from 'path';
import shell from 'shelljs';

import LLVMCodeGen from './codegen';
import Prelude from './prelude';

const program = new commander.Command();

program.version('v0.0.1');

program
  .command('build <file>')
  .description('compile packages and dependencies')
  .option('-o, --output <output>', 'place the output into <file>')
  .option('-s, --show', 'show IR code to stdout')
  .option('-t, --triple <triple>', 'LLVM triple')
  .action((args, opts) => build(args, opts));

program
  .command('run <file>')
  .description('compile and run ts program')
  .option('-t, --triple <triple>', 'LLVM triple')
  .action((args, opts) => run(args, opts));

program.parse(process.argv);

interface BuildInfo {
  tempdir: string;
}

function build(args: any, opts: any): BuildInfo {
  llvm.initializeAllTargetInfos();
  llvm.initializeAllTargets();
  llvm.initializeAllTargetMCs();
  llvm.initializeAllAsmParsers();
  llvm.initializeAllAsmPrinters();

  const prelude = new Prelude(args);
  const outputs = prelude.process();

  const codegen = new LLVMCodeGen([outputs]);
  const triple: string = opts.triple ? opts.triple : llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;
  const target = llvm.TargetRegistry.lookupTarget(triple);
  const m = target.createTargetMachine(triple, 'generic');
  codegen.module.dataLayout = m.createDataLayout();
  codegen.module.targetTriple = triple;
  codegen.module.sourceFileName = outputs;
  codegen.genSourceFile(outputs);

  const codeText = codegen.genText();
  const output = path.join(path.dirname(outputs), 'output.ll');
  fs.writeFileSync(output, codeText);
  if (opts.show) {
    process.stdout.write(codeText);
  }
  if (opts.output) {
    fs.copyFileSync(output, opts.output);
  }
  llvm.verifyModule(codegen.module);

  return {
    tempdir: path.dirname(outputs)
  };
}

function run(args: any, opts: any): void {
  const info = build(args, opts);
  const output = path.join(info.tempdir, 'output.ll');
  const execResp = shell.exec(`lli ${output}`, {
    async: false
  });
  process.exit(execResp.code);
}
