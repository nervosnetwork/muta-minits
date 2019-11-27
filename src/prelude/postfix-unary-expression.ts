import ts from 'typescript';

import Prelude from './';

export default class CodeGenPostfixUnary {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
  }

  public genPostfixUnaryExpression(node: ts.PostfixUnaryExpression): ts.BinaryExpression {
    const operand = this.lude.genExpression(node.operand);
    switch (node.operator) {
      // ++
      case ts.SyntaxKind.PlusPlusToken:
        return ts.createBinary(
          operand,
          ts.createToken(ts.SyntaxKind.EqualsToken),
          ts.createBinary(operand, ts.createToken(ts.SyntaxKind.PlusToken), ts.createNumericLiteral('1'))
        );
      // --
      case ts.SyntaxKind.MinusMinusToken:
        return ts.createBinary(
          operand,
          ts.createToken(ts.SyntaxKind.EqualsToken),
          ts.createBinary(operand, ts.createToken(ts.SyntaxKind.MinusToken), ts.createNumericLiteral('1'))
        );
    }
    throw new Error('Error that should never happen');
  }
}
