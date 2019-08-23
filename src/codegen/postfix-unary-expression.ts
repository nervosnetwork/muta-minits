import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenPostfixUnary {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genPostfixUnaryExpression(expr: ts.PostfixUnaryExpression): llvm.Value {
    const e = expr.operand as ts.Expression;
    const lhs = this.cgen.genExpression(e);
    switch (expr.operator) {
      // ++
      case ts.SyntaxKind.PlusPlusToken:
        return (() => {
          const one = llvm.ConstantInt.get(this.cgen.context, 1, 64);
          const r = this.cgen.builder.createAdd(lhs, one);
          const ptr = this.cgen.symtab.get(e.getText()).value;
          this.cgen.builder.createStore(r, ptr);
          return lhs;
        })();
      // --
      case ts.SyntaxKind.MinusMinusToken:
        return (() => {
          const one = llvm.ConstantInt.get(this.cgen.context, 1, 64);
          const r = this.cgen.builder.createSub(lhs, one);
          const ptr = this.cgen.symtab.get(e.getText()).value;
          this.cgen.builder.createStore(r, ptr);
          return lhs;
        })();
      default:
        throw new Error('Unsupported postfix unary expression');
    }
  }
}
