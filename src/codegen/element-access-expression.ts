import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenElemAccess {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const isTypeString = (() => {
      if (node.expression.kind === ts.SyntaxKind.Identifier) {
        const symbol = this.cgen.checker.getSymbolAtLocation(node.expression)!;
        const type = this.cgen.checker.getTypeOfSymbolAtLocation(symbol, node.expression);
        return type.flags === ts.TypeFlags.String;
      }
      return node.expression.kind === ts.SyntaxKind.StringLiteral;
    })();
    const identifer = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    if (isTypeString) {
      return this.cgen.cgString.getElementAccess(identifer, argumentExpression);
    }
    return this.cgen.cgArray.getElementAccess(identifer, argumentExpression);
  }
}
