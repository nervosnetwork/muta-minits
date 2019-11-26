import ts from 'typescript';

import Prelude from './';

// Convert a switch statement to an if statement.
export default class PreludeSwitchStatement {
  private lude: Prelude;

  constructor(lude: Prelude) {
    this.lude = lude;
  }

  public genSwitchStatement(node: ts.SwitchStatement): ts.Statement {
    const data: ts.Statement[] = [];

    const quit = this.createQuitDeclare();
    data.push(quit);

    for (const e of node.caseBlock.clauses) {
      if (e.kind === ts.SyntaxKind.CaseClause) {
        const b = this.createCase(e, this.lude.genExpression(node.expression));
        data.push(b);
      } else {
        const b = this.createDefault(e);
        data.push(b);
      }
    }

    return ts.createBlock(data);
  }

  private createQuitDeclare(): ts.Statement {
    return ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList(
        [ts.createVariableDeclaration(ts.createIdentifier('_quit'), undefined, ts.createFalse())],
        ts.NodeFlags.Let
      )
    );
  }

  private createCase(node: ts.CaseClause, cond: ts.Expression): ts.Statement {
    const data: ts.Statement[] = [];
    for (const e of node.statements) {
      if (e.kind === ts.SyntaxKind.BreakStatement) {
        const quit = ts.createExpressionStatement(
          ts.createBinary(ts.createIdentifier('_quit'), ts.createToken(ts.SyntaxKind.EqualsToken), ts.createTrue())
        );
        data.push(quit);
      } else {
        data.push(this.lude.genStatement(e));
      }
    }

    return ts.createIf(
      ts.createBinary(
        ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.createIdentifier('_quit')),
        ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        ts.createBinary(
          this.lude.genExpression(node.expression),
          ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
          cond
        )
      ),
      ts.createBlock(data),
      undefined
    );
  }

  private createDefault(node: ts.DefaultClause): ts.Statement {
    const data: ts.Statement[] = [];
    for (const e of node.statements) {
      if (e.kind === ts.SyntaxKind.BreakStatement) {
        continue;
      } else {
        data.push(this.lude.genStatement(e));
      }
    }

    return ts.createIf(
      ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.createIdentifier('_quit')),
      ts.createBlock(data),
      undefined
    );
  }
}
