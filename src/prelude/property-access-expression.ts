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
    return node;
  }
}
