import ts from 'typescript';

import Prelude from './';

export default class PreludePropertyAccessExpression {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
    this.lude.emit();
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): ts.PropertyAccessExpression {
    if (node.expression.kind === ts.SyntaxKind.ThisKeyword) {
      return ts.createPropertyAccess(ts.createIdentifier('_this'), node.name);
    }
    const expression = this.lude.genExpression(node.expression);
    const name = node.name;
    return ts.createPropertyAccess(expression, name);
  }
}
