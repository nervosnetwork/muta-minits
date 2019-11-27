import ts from 'typescript';

import Prelude from './';

export default class CodeGenFuncDecl {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
  }

  public genCallExpression(node: ts.CallExpression): ts.CallExpression {
    if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const real = node.expression as ts.PropertyAccessExpression;
      const type = this.lude.checker.getTypeAtLocation(real.expression);
      // Object.method()
      if (type.isClass()) {
        return ts.createCall(
          ts.createIdentifier(type.symbol.name + '_' + real.name.text),
          node.typeArguments,
          [real.expression, ...node.arguments].map(e => this.lude.genExpression(e))
        );
      }
      // This.method()
      if (real.expression.kind === ts.SyntaxKind.ThisKeyword) {
        return ts.createCall(
          ts.createIdentifier(type.symbol.name + '_' + real.name.text),
          node.typeArguments,
          [this.lude.genPropertyAccessExpression(real).expression, ...node.arguments].map(e =>
            this.lude.genExpression(e)
          )
        );
      }
    }
    return ts.createCall(
      this.lude.genExpression(node.expression),
      node.typeArguments,
      ts.createNodeArray(node.arguments.map(e => this.lude.genExpression(e)))
    );
  }
}
