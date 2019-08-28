import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genCallExpression(node: ts.CallExpression): llvm.Value {
    const name = node.expression.getText();
    const args = node.arguments.map(item => {
      return this.cgen.genExpression(item);
    });
    let func: llvm.Constant;
    switch (name) {
      case 'console.log':
        return this.cgen.stdlib.printf(args);
      case 'printf':
        return this.cgen.stdlib.printf(args);
      case 'strcmp':
        return this.cgen.stdlib.strcmp(args);
      case 'syscall':
        return this.cgen.stdlib.syscall(args);
      default:
        func = this.cgen.module.getFunction(name)!;
        break;
    }
    return this.cgen.builder.createCall(func, args);
  }
}
