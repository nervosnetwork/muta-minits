import ts from 'typescript';

import Prelude from './';

export default class PreludeBinaryExpression {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
  }

  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    const lhs = this.lude.genExpression(node.left);
    const rhs = this.lude.genExpression(node.right);

    switch (node.operatorToken.kind) {
      // +=
      case ts.SyntaxKind.PlusEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.PlusToken);
      // -=
      case ts.SyntaxKind.MinusEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.MinusToken);
      // *=
      case ts.SyntaxKind.AsteriskEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.AsteriskToken);
      // /=
      case ts.SyntaxKind.SlashEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.SlashToken);
      // %=
      case ts.SyntaxKind.PercentEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.PercentToken);
      // <<=
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.LessThanLessThanToken);
      // &=
      case ts.SyntaxKind.AmpersandEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.AmpersandToken);
      // |=
      case ts.SyntaxKind.BarEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.BarToken);
      // ^=
      case ts.SyntaxKind.CaretEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.CaretToken);
      // >>=
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.GreaterThanGreaterThanToken);
      // >>>=
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken);
    }
    return ts.createBinary(lhs, node.operatorToken, rhs);
  }

  private genCompoundAssignment(lhs: ts.Expression, rhs: ts.Expression, op: ts.BinaryOperator): ts.Expression {
    const r = ts.createBinary(lhs, ts.createToken(op), rhs);
    return ts.createBinary(lhs, ts.createToken(ts.SyntaxKind.EqualsToken), r);
  }
}
