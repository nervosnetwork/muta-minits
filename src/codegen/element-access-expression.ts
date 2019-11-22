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
    const type = this.cgen.checker.getTypeAtLocation(node.expression);

    if (this.cgen.cgString.isStringLiteral(node.expression)) {
      return this.cgen.cgString.getElementAccess(identifer, argumentExpression);
    }
    if (type.symbol.escapedName === 'Int8Array') {
      return this.cgen.cgInt8Array.getElementAccess(identifer, argumentExpression);
    }
    return this.cgen.cgArray.getElementAccess(identifer, argumentExpression);
  }
}
