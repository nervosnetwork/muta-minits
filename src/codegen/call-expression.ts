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
        func = this.cgen.module.getOrInsertFunction('printf', this.cgen.stdlib.printf());
        break;
      case 'printf':
        func = this.cgen.module.getOrInsertFunction('printf', this.cgen.stdlib.printf());
        break;
      case 'strcmp':
        func = this.cgen.module.getOrInsertFunction('strcmp', this.cgen.stdlib.strcmp());
        break;
      case 'syscall':
        func = this.cgen.module.getOrInsertFunction('syscall', this.cgen.stdlib.syscall());
        break;
      default:
        func = this.cgen.module.getFunction(name)!;
        break;
    }
    return this.cgen.builder.createCall(func, args);
  }
}
