import ts from 'typescript';

import Prelude from '.';

export default class PreludeClassDeclaration {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
  }

  public genClassDeclaration(node: ts.ClassDeclaration): ts.Block {
    const properties: ts.PropertyDeclaration[] = [];
    const constructor: ts.ConstructorDeclaration[] = [];
    const methods: ts.MethodDeclaration[] = [];

    for (const e of node.members) {
      if (ts.isPropertyDeclaration(e)) {
        properties.push(e);
        continue;
      }
      if (ts.isConstructorDeclaration(e)) {
        constructor.push(e);
        continue;
      }
      if (ts.isMethodDeclaration(e)) {
        methods.push(e);
        continue;
      }
    }

    const statements: ts.Statement[] = [];
    statements.push(node);

    if (constructor.length !== 0) {
      const c = this.genConstructorDeclaration(constructor[0], node.name!.text);
      statements.push(c);
    }
    for (const e of methods) {
      const c = this.genMethodDeclaration(e, node.name!.text);
      statements.push(c);
    }

    return ts.createBlock(statements);
  }

  private genConstructorDeclaration(node: ts.ConstructorDeclaration, name: string): ts.FunctionDeclaration {
    const body: ts.Statement[] = [];
    for (const e of node.body!.statements) {
      const f = this.lude.genStatement(e);
      body.push(f);
    }

    const arg0 = ts.createParameter(
      undefined,
      undefined,
      undefined,
      ts.createIdentifier('_this'),
      undefined,
      ts.createTypeReferenceNode(ts.createIdentifier(name), undefined),
      undefined
    );
    const args = [arg0, ...node.parameters];

    const full = ts.createFunctionDeclaration(
      undefined,
      undefined,
      undefined,
      ts.createIdentifier(name + '_constructor'),
      undefined,
      args,
      ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      ts.createBlock(body, true)
    );

    return full;
  }

  private genMethodDeclaration(node: ts.MethodDeclaration, name: string): ts.FunctionDeclaration {
    const body: ts.Statement[] = [];
    for (const e of node.body!.statements) {
      const f = this.lude.genStatement(e);
      body.push(f);
    }

    const arg0 = ts.createParameter(
      undefined,
      undefined,
      undefined,
      ts.createIdentifier('_this'),
      undefined,
      ts.createTypeReferenceNode(ts.createIdentifier(name), undefined),
      undefined
    );
    const args = [arg0, ...node.parameters];

    const full = ts.createFunctionDeclaration(
      undefined,
      undefined,
      undefined,
      ts.createIdentifier(name + '_' + (node.name as ts.Identifier).text),
      undefined,
      args,
      ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      ts.createBlock(body, true)
    );

    return full;
  }
}
