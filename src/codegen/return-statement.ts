import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from '.';

export default class CodeGenReturn {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genReturnStatement(node: ts.ReturnStatement): llvm.Value {
    if (node.expression) {
      return this.cgen.builder.createRet(
        this.cgen.genAutoDereference(this.cgen.genExpression(node.expression))
      );
    } else {
      return this.cgen.builder.createRetVoid();
    }
  }
}
