import assert from 'assert';
import crypto from 'crypto';
import Debug from 'debug';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

import PreludeBinaryExpression from './binary-expression';
import PreludeClassDeclaration from './class-declaration';
import PreludePropertyAccessExpression from './property-access-expression';
import PreludeSwitchStatement from './switch-statement';

const debug = Debug('minits:prelude');

export default class Prelude {
  public readonly main: string;
  public readonly rootdir: string;
  public readonly depends: string[];
  public readonly tempdir: string;

  public readonly preludeBinaryExpression: PreludeBinaryExpression;
  public readonly preludeClassDeclaration: PreludeClassDeclaration;
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

    const hash = crypto
      .createHash('md5')
      .update(fs.readFileSync(main))
      .digest()
      .toString('hex');

    this.tempdir = path.join(shell.tempdir(), 'minits', hash);
    this.preludeBinaryExpression = new PreludeBinaryExpression(this);
    this.preludeClassDeclaration = new PreludeClassDeclaration(this);
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
    const allfile = [this.main, ...this.depends];
    const program = ts.createProgram(allfile, {});
    allfile.forEach(file => {
      const sources = program.getSourceFile(file)!;
      const tmpPath = path.join(this.tempdir, path.relative(this.rootdir, file));

      const tmpFile = ts.createSourceFile(tmpPath, '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
      const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed
      });
      const r: string[] = [];
      sources.forEachChild(node => {
        switch (node.kind) {
          case ts.SyntaxKind.FunctionDeclaration:
            const a = this.genFunctionDeclaration(node as ts.FunctionDeclaration);
            r.push(printer.printNode(ts.EmitHint.Unspecified, a, tmpFile));
            r.push('\n');
            break;
          case ts.SyntaxKind.ClassDeclaration:
            const b = this.genClassDeclaration(node as ts.ClassDeclaration);
            b.forEachChild(e => {
              r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
              r.push('\n');
            });
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

  // 190 SyntaxKind.PropertyAccessExpression
  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): ts.PropertyAccessExpression {
    return this.preludePropertyAccessExpression.genPropertyAccessExpression(node);
  }

  // 205 SyntaxKind.BinaryExpression
  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    return this.preludeBinaryExpression.genBinaryExpression(node);
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
    return ts.createBlock(statements);
  }

  // 220 SyntaxKind.VariableStatement
  public genVariableStatement(node: ts.VariableStatement): ts.VariableStatement {
    const declarations = node.declarationList.declarations.map(item => {
      if (item.initializer) {
        const initializer = this.genExpression(item.initializer);
        return ts.createVariableDeclaration(item.name, item.type, initializer);
      } else {
        return item;
      }
    });
    return ts.createVariableStatement(node.modifiers, ts.createVariableDeclarationList(declarations));
  }

  // 222 SyntaxKind.ExpressionStatement
  public genExpressionStatement(node: ts.ExpressionStatement): ts.ExpressionStatement {
    node.expression = this.genExpression(node.expression);
    return node;
  }

  // 223 SyntaxKind.IfStatement
  public genIfStatement(node: ts.IfStatement): ts.IfStatement {
    node.expression = this.genExpression(node.expression);
    node.thenStatement = this.genStatement(node.thenStatement);
    if (node.elseStatement) {
      node.elseStatement = this.genStatement(node.elseStatement);
    }
    return node;
  }

  // 224 SyntaxKind.DoStatement
  public genDoStatement(node: ts.DoStatement): ts.DoStatement {
    node.statement = this.genStatement(node);
    return node;
  }

  // 225 SyntaxKind.WhileStatement
  public genWhileStatement(node: ts.WhileStatement): ts.WhileStatement {
    node.expression = this.genExpression(node.expression);
    node.statement = this.genStatement(node.statement);
    return node;
  }

  // 226 SyntaxKind.ForStatement
  public genForStatement(node: ts.ForStatement): ts.ForStatement {
    if (node.condition) {
      node.condition = this.genExpression(node.condition);
    }
    node.statement = this.genStatement(node.statement);
    return node;
  }

  // 228 SyntaxKind.ForOfStatement
  public genForOfStatement(node: ts.ForOfStatement): ts.ForOfStatement {
    node.statement = this.genStatement(node.statement);
    return node;
  }

  // 240 SyntaxKind.FunctionDeclaration
  public genFunctionDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
    node.body = this.genBlock(node.body!);
    return node;
  }

  // 241 SyntaxKind.ClassDeclaration
  public genClassDeclaration(node: ts.ClassDeclaration): ts.Block {
    return this.preludeClassDeclaration.genClassDeclaration(node);
  }

  // 233 SyntaxKind.SwitchStatement
  public genSwitchStatement(node: ts.SwitchStatement): ts.Statement {
    return this.preludeSwitchStatement.genSwitchStatement(node);
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
      case ts.SyntaxKind.SwitchStatement:
        return this.genSwitchStatement(node as ts.SwitchStatement);
      default:
        return node;
    }
  }

  public genExpression(node: ts.Expression): ts.Expression {
    switch (node.kind) {
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.genPropertyAccessExpression(node as ts.PropertyAccessExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(node as ts.BinaryExpression);
    }
    return node;
  }
}
