import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenPrefixUnary {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genPrefixUnaryExpression(expr: ts.PrefixUnaryExpression): llvm.Value {
    switch (expr.operator) {
      // ~
      case ts.SyntaxKind.TildeToken:
        return this.cgen.builder.createXor(
          this.cgen.genExpression(expr.operand),
          llvm.ConstantInt.get(this.cgen.context, -1, 64)
        );
      // !
      case ts.SyntaxKind.ExclamationToken:
        return this.cgen.builder.createNot(this.cgen.genExpression(expr.operand));
    }
    throw new Error('Error that should never happen');
  }
}
