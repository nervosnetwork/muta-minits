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
        return this.genPostfixUnaryExpressionPlusPlus(lhs, e.getText());
      // --
      case ts.SyntaxKind.MinusMinusToken:
        return this.genPostfixUnaryExpressionMinusMinus(lhs, e.getText());
      default:
        throw new Error('Unsupported postfix unary expression');
    }
  }

  public genPostfixUnaryExpressionPlusPlus(node: llvm.Value, name: string): llvm.Value {
    const raw = this.cgen.builder.createLoad(node);
    const one = llvm.ConstantInt.get(this.cgen.context, 1, 64);
    const r = this.cgen.builder.createAdd(raw, one);
    const ptr = this.cgen.symtab.get(name);
    this.cgen.builder.createStore(r, ptr);
    return raw;
  }

  public genPostfixUnaryExpressionMinusMinus(node: llvm.Value, name: string): llvm.Value {
    const raw = this.cgen.builder.createLoad(node);
    const one = llvm.ConstantInt.get(this.cgen.context, 1, 64);
    const r = this.cgen.builder.createSub(raw, one);
    const ptr = this.cgen.symtab.get(name);
    this.cgen.builder.createStore(r, ptr);
    return raw;
  }
}
