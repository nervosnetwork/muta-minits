import assert from 'assert';
import crypto from 'crypto';
import Debug from 'debug';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import PreludeBinaryExpression from './binary-expression';
import PreludeClassDeclaration from './class-declaration';
import PreludePostfixUnaryExpression from './postfix-unary-expression';
import PreludePropertyAccessExpression from './property-access-expression';
import PreludeSwitchStatement from './switch-statement';

const debug = Debug('minits:prelude');

export default class Prelude {
  public readonly main: string;
  public readonly rootdir: string;
  public readonly depends: string[];
  public readonly tempdir: string;
  public readonly allfile: string[];
  public readonly program: ts.Program;
  public readonly checker: ts.TypeChecker;

  public readonly preludeBinaryExpression: PreludeBinaryExpression;
  public readonly preludeClassDeclaration: PreludeClassDeclaration;
  public readonly preludePostfixUnaryExpression: PreludePostfixUnaryExpression;
  public readonly preludePropertyAccessExpression: PreludePropertyAccessExpression;
  public readonly preludeSwitchStatement: PreludeSwitchStatement;

  constructor(main: string) {
    debug(`Starts ${main}`);
    this.main = main;
    this.rootdir = path.dirname(main);
    this.depends = this.getDepends(main).slice(1);
    for (const e of this.depends) {
      debug(`Depend ${e}`);
    }
    this.allfile = [this.main, ...this.depends];
    this.program = ts.createProgram(this.allfile, {});
    this.checker = this.program.getTypeChecker();

    const hash = crypto
      .createHash('md5')
      .update(fs.readFileSync(main))
      .digest()
      .toString('hex');

    this.tempdir = path.join(shell.tempdir(), 'minits', hash);
    this.preludeBinaryExpression = new PreludeBinaryExpression(this);
    this.preludeClassDeclaration = new PreludeClassDeclaration(this);
    this.preludePostfixUnaryExpression = new PreludePostfixUnaryExpression(this);
    this.preludePropertyAccessExpression = new PreludePropertyAccessExpression(this);
    this.preludeSwitchStatement = new PreludeSwitchStatement(this);
  }

  public emit(): void {
    assert(this.main);
  }

  // Dependency tree takes in a starting file, extracts its declared dependencies via precinct, resolves each of those
  // dependencies to a file on the filesystem via filing-cabinet, then recursively performs those steps until there are
  // no more dependencies to process.
  //
  // GA: DFS.
  public getDepends(main: string): string[] {
    const open: string[] = [main];
    const closed: string[] = [];

    while (open.length !== 0) {
      const name = open.pop()!;
      const sourceFile = ts.createSourceFile(name, fs.readFileSync(name).toString(), ts.ScriptTarget.ES2020, true);
      sourceFile.forEachChild(node => {
        if (!ts.isImportDeclaration(node)) {
          return;
        }
        const importNode = node as ts.ImportDeclaration;
        const relPath = (importNode.moduleSpecifier as ts.StringLiteral).text + '.ts';
        const absPath = path.join(path.dirname(name), relPath);
        if (closed.includes(absPath)) {
          return;
        }
        open.push(absPath);
      });
      closed.push(name);
    }
    return closed;
  }

  public process(): void {
    debug(`Create TmpDir ${this.tempdir}`);
    fs.mkdirSync(this.tempdir, { recursive: true });
    this.allfile.forEach(file => {
      const sources = this.program.getSourceFile(file)!;
      const tmpPath = path.join(this.tempdir, path.relative(this.rootdir, file));

      const tmpFile = ts.createSourceFile(
        tmpPath,
        fs.readFileSync(file).toString(),
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS
      );
      const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed
      });
      const r: string[] = [];
      sources.forEachChild(node => {
        switch (node.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            const a = this.genStatement(node as ts.FunctionDeclaration);
            r.push(printer.printNode(ts.EmitHint.Unspecified, a, tmpFile));
            r.push('\n');
            break;
          case ts.SyntaxKind.ClassDeclaration:
            const b = this.genStatement(node as ts.ClassDeclaration);
            b.forEachChild(e => {
              r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
              r.push('\n');
            });
            break;
          case ts.SyntaxKind.VariableStatement:
            const c = this.genStatement(node as ts.VariableStatement);
            r.push(printer.printNode(ts.EmitHint.Unspecified, c, tmpFile));
            r.push('\n');
            break;
          case ts.SyntaxKind.EnumDeclaration:
            const d = this.genStatement(node as ts.EnumDeclaration);
            r.push(printer.printNode(ts.EmitHint.Unspecified, d, tmpFile));
            r.push('\n');
            break;
          default:
            r.push(printer.printNode(ts.EmitHint.Unspecified, node, tmpFile));
            break;
        }
      });
      fs.writeFileSync(tmpPath, r.join(''));
      debug(`Expand ${file} => ${tmpPath}`);
    });
  }

  // 008 SyntaxKind.NumericLiteral
  public genNumericLiteral(node: ts.NumericLiteral): ts.NumericLiteral {
    return ts.createNumericLiteral(node.text);
  }

  // 010 SyntaxKind.StringLiteral
  public genStringLiteral(node: ts.StringLiteral): ts.StringLiteral {
    return ts.createStringLiteral(node.text);
  }

  // 073 SyntaxKind.Identifier
  public genIdentifier(node: ts.Identifier): ts.Identifier {
    return ts.createIdentifier(node.text);
  }

  // 188 SyntaxKind.ArrayLiteralExpression
  public genArrayLiteralExpression(node: ts.ArrayLiteralExpression): ts.ArrayLiteralExpression {
    return ts.createArrayLiteral(node.elements.map(e => this.genExpression(e)), false);
  }

  // 189 SyntaxKind.ObjectLiteralExpression
  public genObjectLiteralExpression(node: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression {
    const properties = node.properties.map(e => {
      const a = e as ts.PropertyAssignment;
      return ts.createPropertyAssignment(a.name, this.genExpression(a.initializer));
    });
    return ts.createObjectLiteral(properties, false);
  }

  // 190 SyntaxKind.PropertyAccessExpression
  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): ts.PropertyAccessExpression {
    return this.preludePropertyAccessExpression.genPropertyAccessExpression(node);
  }

  // 191 SyntaxKind.ElementAccessExpression
  public genElementAccessExpression(node: ts.ElementAccessExpression): ts.ElementAccessExpression {
    return ts.createElementAccess(this.genExpression(node.expression), this.genExpression(node.argumentExpression));
  }

  // 192 SyntaxKind.CallExpression
  public genCallExpression(node: ts.CallExpression): ts.CallExpression {
    if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const real = node.expression as ts.PropertyAccessExpression;
      const type = this.checker.getTypeAtLocation(real.expression);
      if (type.isClass()) {
        return ts.createCall(
          ts.createIdentifier(type.symbol.name + '_' + real.name.text),
          node.typeArguments,
          [real.expression, ...node.arguments].map(e => this.genExpression(e))
        );
      }
    }
    return ts.createCall(
      this.genExpression(node.expression),
      node.typeArguments,
      ts.createNodeArray(node.arguments.map(e => this.genExpression(e)))
    );
  }

  // 193 SyntaxKind.NewExpression
  public genNewExpression(node: ts.NewExpression): ts.NewExpression {
    return ts.createNew(
      this.genExpression(node.expression),
      node.typeArguments,
      node.arguments ? node.arguments!.map(e => this.genExpression(e)) : undefined
    );
  }

  // 204 SyntaxKind.PostfixUnaryExpression
  public genPostfixUnaryExpression(node: ts.PostfixUnaryExpression): ts.BinaryExpression {
    return this.preludePostfixUnaryExpression.genPostfixUnaryExpression(node);
  }

  // 205 SyntaxKind.BinaryExpression
  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    return this.preludeBinaryExpression.genBinaryExpression(node);
  }

  // 206 SyntaxKind.ConditionalExpression
  public genConditionalExpression(node: ts.ConditionalExpression): ts.ConditionalExpression {
    return ts.createConditional(
      this.genExpression(node.condition),
      this.genExpression(node.whenTrue),
      this.genExpression(node.whenFalse)
    );
  }

  // 219 SyntaxKind.Block
  public genBlock(node: ts.Block): ts.Block {
    const statements: ts.Statement[] = [];
    node.statements.forEach(b => {
      const e = this.genStatement(b);
      if (e.kind === ts.SyntaxKind.Block) {
        statements.push(...(e as ts.Block).statements);
      } else {
        statements.push(e);
      }
    });
    return ts.createBlock(statements, true);
  }

  // 220 SyntaxKind.VariableStatement
  public genVariableStatement(node: ts.VariableStatement): ts.VariableStatement {
    return ts.createVariableStatement(node.modifiers, this.genVariableDeclarationList(node.declarationList));
  }

  // 222 SyntaxKind.ExpressionStatement
  public genExpressionStatement(node: ts.ExpressionStatement): ts.ExpressionStatement {
    return ts.createExpressionStatement(this.genExpression(node.expression));
  }

  // 223 SyntaxKind.IfStatement
  public genIfStatement(node: ts.IfStatement): ts.IfStatement {
    return ts.createIf(
      this.genExpression(node.expression),
      this.genStatement(node.thenStatement),
      node.elseStatement ? this.genStatement(node.elseStatement) : undefined
    );
  }

  // 224 SyntaxKind.DoStatement
  public genDoStatement(node: ts.DoStatement): ts.DoStatement {
    return ts.createDo(this.genStatement(node), this.genExpression(node.expression));
  }

  // 225 SyntaxKind.WhileStatement
  public genWhileStatement(node: ts.WhileStatement): ts.WhileStatement {
    return ts.createWhile(this.genExpression(node.expression), this.genStatement(node.statement));
  }

  // 226 SyntaxKind.ForStatement
  public genForStatement(node: ts.ForStatement): ts.ForStatement {
    const initializer = (() => {
      if (!node.initializer) {
        return undefined;
      }
      if (ts.isVariableDeclarationList(node.initializer)) {
        return this.genVariableDeclarationList(node.initializer);
      }
      return this.genExpression(node.initializer);
    })();
    return ts.createFor(
      initializer,
      node.condition ? this.genExpression(node.condition) : undefined,
      node.incrementor ? this.genExpression(node.incrementor) : undefined,
      this.genStatement(node.statement)
    );
  }

  // 228 SyntaxKind.ForOfStatement
  public genForOfStatement(node: ts.ForOfStatement): ts.ForOfStatement {
    return ts.createForOf(
      node.awaitModifier,
      this.genExpression(node.initializer as ts.Expression),
      this.genExpression(node.expression),
      this.genStatement(node.statement)
    );
  }

  // 231 SyntaxKind.ReturnStatement
  public genReturnStatement(node: ts.ReturnStatement): ts.ReturnStatement {
    return ts.createReturn(node.expression ? this.genExpression(node.expression) : undefined);
  }

  // 233 SyntaxKind.SwitchStatement
  public genSwitchStatement(node: ts.SwitchStatement): ts.Statement {
    return this.preludeSwitchStatement.genSwitchStatement(node);
  }

  // 239 SyntaxKind.VariableDeclarationList
  public genVariableDeclarationList(node: ts.VariableDeclarationList): ts.VariableDeclarationList {
    return ts.createVariableDeclarationList(
      node.declarations.map(e => {
        return ts.createVariableDeclaration(
          e.name,
          e.type,
          e.initializer ? this.genExpression(e.initializer) : undefined
        );
      })
    );
  }

  // 240 SyntaxKind.FunctionDeclaration
  public genFunctionDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
    return ts.createFunctionDeclaration(
      node.decorators,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      node.body ? this.genBlock(node.body) : undefined
    );
  }

  // 241 SyntaxKind.ClassDeclaration
  public genClassDeclaration(node: ts.ClassDeclaration): ts.Block {
    return this.preludeClassDeclaration.genClassDeclaration(node);
  }

  // 244 SyntaxKind.EnumDeclaration
  public genEnumDeclaration(node: ts.EnumDeclaration): ts.EnumDeclaration {
    return ts.createEnumDeclaration(
      node.decorators,
      node.modifiers,
      node.name,
      node.members.map(e => {
        return ts.createEnumMember(e.name, e.initializer ? this.genExpression(e.initializer) : undefined);
      })
    );
  }

  public genStatement(node: ts.Statement): ts.Statement {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        return this.genBlock(node as ts.Block);
      case ts.SyntaxKind.VariableStatement:
        return this.genVariableStatement(node as ts.VariableStatement);
      case ts.SyntaxKind.ExpressionStatement:
        return this.genExpressionStatement(node as ts.ExpressionStatement);
      case ts.SyntaxKind.IfStatement:
        return this.genIfStatement(node as ts.IfStatement);
      case ts.SyntaxKind.DoStatement:
        return this.genDoStatement(node as ts.DoStatement);
      case ts.SyntaxKind.WhileStatement:
        return this.genWhileStatement(node as ts.WhileStatement);
      case ts.SyntaxKind.ForStatement:
        return this.genForStatement(node as ts.ForStatement);
      case ts.SyntaxKind.ForOfStatement:
        return this.genForOfStatement(node as ts.ForOfStatement);
      case ts.SyntaxKind.ReturnStatement:
        return this.genReturnStatement(node as ts.ReturnStatement);
      case ts.SyntaxKind.SwitchStatement:
        return this.genSwitchStatement(node as ts.SwitchStatement);
      case ts.SyntaxKind.FunctionDeclaration:
        return this.genFunctionDeclaration(node as ts.FunctionDeclaration);
      case ts.SyntaxKind.ClassDeclaration:
        return this.genClassDeclaration(node as ts.ClassDeclaration);
      case ts.SyntaxKind.EnumDeclaration:
        return this.genEnumDeclaration(node as ts.EnumDeclaration);
      default:
        return node;
    }
  }

  public genExpression(node: ts.Expression): ts.Expression {
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumericLiteral(node as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.genStringLiteral(node as ts.StringLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(node as ts.Identifier);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genArrayLiteralExpression(node as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.genObjectLiteralExpression(node as ts.ObjectLiteralExpression);
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.genPropertyAccessExpression(node as ts.PropertyAccessExpression);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.genElementAccessExpression(node as ts.ElementAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.genCallExpression(node as ts.CallExpression);
      case ts.SyntaxKind.NewExpression:
        return this.genNewExpression(node as ts.NewExpression);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.genPostfixUnaryExpression(node as ts.PostfixUnaryExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(node as ts.BinaryExpression);
      case ts.SyntaxKind.ConditionalExpression:
        return this.genConditionalExpression(node as ts.ConditionalExpression);
    }
    return node;
  }
}
