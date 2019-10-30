import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenElemAccess {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genElementAccessExpression(node: ts.ElementAccessExpression): llvm.Value {
    const identifer = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    if (this.cgen.cgString.isStringLiteral(node.expression)) {
      return this.cgen.cgString.getElementAccess(identifer, argumentExpression);
    }
    const e = this.cgen.cgArray.getElementAccess(identifer, argumentExpression);
    const type = this.cgen.checker.getTypeAtLocation(node.expression);
    if (type.symbol.escapedName === 'Buffer') {
      return this.cgen.builder.createIntCast(e, llvm.Type.getInt64Ty(this.cgen.context), true);
    }
    return e;
  }
}
