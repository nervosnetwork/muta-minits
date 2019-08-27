import llvm from 'llvm-node';
import ts from 'typescript';

import Stdlib from '../stdlib';
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
        func = this.cgen.module.getOrInsertFunction('printf', Stdlib.printf(this.cgen));
        break;
      case 'strcmp':
        func = this.cgen.module.getOrInsertFunction('strcmp', Stdlib.strcmp(this.cgen));
        break;
      default:
        func = this.cgen.module.getFunction(name)!;
        break;
    }
    return this.cgen.builder.createCall(func, args);
  }
}
