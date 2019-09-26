import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenElemAccess {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    if (node.expression.kind === ts.SyntaxKind.Identifier) {
      const symbol = this.cgen.checker.getSymbolAtLocation(node.expression)!;
      const type = this.cgen.checker.getTypeOfSymbolAtLocation(symbol, node.expression);
      if (type.flags === ts.TypeFlags.String) {
        return this.cgen.cgString.genElementAccess(node);
      }
      return this.cgen.cgArray.genElementAccess(node);
    }

    const identifer = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    if (node.expression.kind === ts.SyntaxKind.StringLiteral) {
      return this.cgen.cgString.getElementAccess(identifer, argumentExpression);
    }
    return this.cgen.cgArray.getElementAccess(identifer, argumentExpression);
  }
}
