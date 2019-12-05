import crypto from 'crypto';
import Debug from 'debug';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import ts from 'typescript';

const debug = Debug('minits:prelude');

interface Option {
  entryfn: string;
  tempdir: string;
}

class Base {
  public option: Option;
  public program: ts.Program;
  public checker: ts.TypeChecker;

  constructor(option: Option) {
    this.option = option;
    this.program = ts.createProgram([option.entryfn], {});
    this.checker = this.program.getTypeChecker();
  }

  public process(): string {
    return '';
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

  // 101 SyntaxKind.ThisKeyword
  public genThisKeyword(): ts.Expression {
    return ts.createThis();
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
  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): ts.Expression {
    return ts.createPropertyAccess(this.genExpression(node.expression), this.genIdentifier(node.name));
  }

  // 191 SyntaxKind.ElementAccessExpression
  public genElementAccessExpression(node: ts.ElementAccessExpression): ts.ElementAccessExpression {
    return ts.createElementAccess(this.genExpression(node.expression), this.genExpression(node.argumentExpression));
  }

  // 192 SyntaxKind.CallExpression
  public genCallExpression(node: ts.CallExpression): ts.CallExpression {
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

  // 203 SyntaxKind.PrefixUnaryExpression
  public genPrefixUnaryExpression(node: ts.PrefixUnaryExpression): ts.Expression {
    return ts.createPrefix(node.operator, this.genExpression(node.operand));
  }

  // 204 SyntaxKind.PostfixUnaryExpression
  public genPostfixUnaryExpression(node: ts.PostfixUnaryExpression): ts.Expression {
    return ts.createPostfix(this.genExpression(node.operand), node.operator);
  }

  // 205 SyntaxKind.BinaryExpression
  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    return ts.createBinary(this.genExpression(node.left), node.operatorToken, this.genExpression(node.right));
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
    return ts.createBlock(this.genStatementList(node.statements), true);
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
    return ts.createSwitch(
      this.genExpression(node.expression),
      ts.createCaseBlock(
        node.caseBlock.clauses.map(node => {
          if (node.kind === ts.SyntaxKind.CaseClause) {
            return ts.createCaseClause(this.genExpression(node.expression), this.genStatementList(node.statements));
          } else {
            return ts.createDefaultClause(this.genStatementList(node.statements));
          }
        })
      )
    );
  }

  // 238 SyntaxKind.VariableDeclaration
  public genVariableDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration {
    return ts.createVariableDeclaration(
      node.name,
      node.type,
      node.initializer ? this.genExpression(node.initializer) : undefined
    );
  }

  // 239 SyntaxKind.VariableDeclarationList
  public genVariableDeclarationList(node: ts.VariableDeclarationList): ts.VariableDeclarationList {
    return ts.createVariableDeclarationList(node.declarations.map(e => this.genVariableDeclaration(e)), node.flags);
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
      node.type ? node.type : ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      node.body ? this.genBlock(node.body) : undefined
    );
  }

  // 241 SyntaxKind.ClassDeclaration
  public genClassDeclaration(node: ts.ClassDeclaration): ts.Block {
    return ts.createBlock([
      ts.createClassDeclaration(
        node.decorators,
        node.modifiers,
        node.name,
        node.typeParameters,
        node.heritageClauses,
        ts.createNodeArray(
          node.members.map(node => {
            if (ts.isPropertyDeclaration(node)) {
              return ts.createProperty(
                node.decorators,
                node.modifiers,
                node.name,
                node.questionToken,
                node.type,
                node.initializer
              );
            }
            if (ts.isConstructorDeclaration(node)) {
              return ts.createConstructor(node.decorators, node.modifiers, node.parameters, this.genBlock(node.body!));
            }
            if (ts.isMethodDeclaration(node)) {
              return ts.createMethod(
                node.decorators,
                node.modifiers,
                node.asteriskToken,
                node.name,
                node.questionToken,
                node.typeParameters,
                node.parameters,
                node.type,
                this.genBlock(node.body!)
              );
            }
            return node;
          })
        )
      )
    ]);
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

  // 245 SyntaxKind.ModuleDeclaration
  public genModuleDeclaration(node: ts.ModuleDeclaration): ts.ModuleDeclaration {
    return ts.createModuleDeclaration(
      node.decorators,
      node.modifiers,
      ts.createIdentifier(node.name.text),
      ts.createModuleBlock((node.body! as ts.ModuleBlock).statements.map(e => this.genStatement(e))),
      node.flags
    );
  }

  // 285 SyntaxKind.SourceFile
  public genSourceFile(node: ts.SourceFile): ts.Statement[] {
    const r: ts.Statement[] = [];
    node.forEachChild(node => {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
          r.push(this.genStatement(node as ts.VariableStatement));
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          r.push(this.genStatement(node as ts.FunctionDeclaration));
          break;
        case ts.SyntaxKind.ClassDeclaration:
          this.genClassDeclaration(node as ts.ClassDeclaration).statements.forEach(node => {
            r.push(node);
          });
          break;
        case ts.SyntaxKind.EnumDeclaration:
          r.push(this.genStatement(node as ts.EnumDeclaration));
          break;
        case ts.SyntaxKind.ModuleDeclaration:
          r.push(this.genStatement(node as ts.ModuleDeclaration));
          break;
      }
    });
    return r;
  }

  public genExpression(node: ts.Expression): ts.Expression {
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumericLiteral(node as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.genStringLiteral(node as ts.StringLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(node as ts.Identifier);
      case ts.SyntaxKind.ThisKeyword:
        return this.genThisKeyword();
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
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.genPrefixUnaryExpression(node as ts.PrefixUnaryExpression);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.genPostfixUnaryExpression(node as ts.PostfixUnaryExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(node as ts.BinaryExpression);
      case ts.SyntaxKind.ConditionalExpression:
        return this.genConditionalExpression(node as ts.ConditionalExpression);
    }
    return node;
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
      case ts.SyntaxKind.ModuleDeclaration:
        return this.genModuleDeclaration(node as ts.ModuleDeclaration);
      default:
        return node;
    }
  }

  public genStatementList(node: ts.NodeArray<ts.Statement>): ts.NodeArray<ts.Statement> {
    const statements: ts.Statement[] = [];
    node.forEach(node => {
      if (ts.isBlock(node)) {
        statements.push(...this.genStatementList(node.statements));
      } else {
        statements.push(this.genStatement(node));
      }
    });
    return ts.createNodeArray(statements);
  }
}

// Layer0 is a module-level transformation. It process lib importation as an internal module.
//
// Before
//
//   lib.ts
//     export const name = 'lib';
//   main.ts
//     import * as lib from './lib';
//
// Bypass
//
//   main.ts
//     module lib {
//       export const name = 'lib';
//     }
class PreludeLayer0 extends Base {
  public process(): string {
    const depends = this.getDepends(this.option.entryfn).slice(1);
    for (const e of depends) {
      debug(`Find depend ${e}`);
    }
    const allfile = [this.option.entryfn, ...depends];
    const program = ts.createProgram(allfile, {});

    const tmpPath = path.join(this.option.tempdir, 'output.layer0.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    depends.reverse().forEach(file => {
      const a = ts.createModuleDeclaration(
        undefined,
        undefined,
        ts.createIdentifier(path.basename(file).slice(0, -3)),
        ts.createModuleBlock(this.genSourceFile(program.getSourceFile(file)!)),
        undefined
      );
      r.push(printer.printNode(ts.EmitHint.Unspecified, a, tmpFile));
      r.push('\n');
    });
    this.genSourceFile(program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // Dependency tree takes in a starting file, extracts its declared dependencies via precinct, resolves each of those
  // dependencies to a file on the filesystem via filing-cabinet, then recursively performs those steps until there are
  // no more dependencies to process.
  //
  // GA: DFS.
  private getDepends(main: string): string[] {
    const open: string[] = [main];
    let closed: string[] = [];

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
          closed = closed.filter(e => e !== absPath);
          closed.push(absPath);
          return;
        }
        open.push(absPath);
      });
      closed.push(name);
    }
    return closed;
  }
}

// Layer1 is a class-level transformation. It represents method as a normal function.
//
// Before
//   class Point {
//     echo() {}
//   }
//
// Bypass
//   class Point {}
//   function Point_echo(_this: Point) {}
//
class PreludeLayer1 extends Base {
  public process(): string {
    const tmpPath = path.join(this.option.tempdir, 'output.layer1.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    this.genSourceFile(this.program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // 101 SyntaxKind.ThisKeyword
  public genThisKeyword(): ts.Identifier {
    return ts.createIdentifier('_this');
  }

  // 241 SyntaxKind.ClassDeclaration
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
      const f = this.genStatement(e);
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
      const f = this.genStatement(e);
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
      node.type,
      ts.createBlock(body, true)
    );

    return full;
  }
}

// Layer2 is a function-level transformation.
class PreludeLayer2 extends Base {
  public process(): string {
    const tmpPath = path.join(this.option.tempdir, 'output.layer2.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    this.genSourceFile(this.program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // 240 SyntaxKind.FunctionDeclaration
  //
  // The function must explicitly specify its return type. The void return type could be ignored, but it is now forced
  // to join.
  //
  // Example:
  //   function echo() { return; }    => function echo(): void { return; }
  public genFunctionDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
    return ts.createFunctionDeclaration(
      node.decorators,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type ? node.type : ts.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      node.body ? this.genBlock(node.body) : undefined
    );
  }
}

// Layer3 is a statement-level transformation.
class PreludeLayer3 extends Base {
  public process(): string {
    const tmpPath = path.join(this.option.tempdir, 'output.layer3.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    this.genSourceFile(this.program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // 233 SyntaxKind.SwitchStatement
  // Convert a switch statement to an if statement.
  public genSwitchStatement(node: ts.SwitchStatement): ts.Statement {
    const data: ts.Statement[] = [];

    const quit = this.createQuitDeclare();
    data.push(quit);

    for (const e of node.caseBlock.clauses) {
      if (e.kind === ts.SyntaxKind.CaseClause) {
        const b = this.createCase(e, this.genExpression(node.expression));
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
        [
          ts.createVariableDeclaration(
            ts.createIdentifier('_quit'),
            ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
            ts.createFalse()
          )
        ],
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
        data.push(this.genStatement(e));
      }
    }

    return ts.createIf(
      ts.createBinary(
        ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.createIdentifier('_quit')),
        ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        this.genExpression(
          ts.createBinary(node.expression, ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), cond)
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
        data.push(this.genStatement(e));
      }
    }

    return ts.createIf(
      ts.createPrefix(ts.SyntaxKind.ExclamationToken, ts.createIdentifier('_quit')),
      ts.createBlock(data),
      undefined
    );
  }
}

// Layer4 is a expression-level transformation.
class PreludeLayer4 extends Base {
  public process(): string {
    const tmpPath = path.join(this.option.tempdir, 'output.layer4.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    this.genSourceFile(this.program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // 192 SyntaxKind.CallExpression
  public genCallExpression(node: ts.CallExpression): ts.CallExpression {
    if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const real = node.expression as ts.PropertyAccessExpression;
      const type = this.checker.getTypeAtLocation(real.expression);

      if (type.symbol.valueDeclaration.kind === ts.SyntaxKind.ClassDeclaration) {
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

  // 203 SyntaxKind.PrefixUnaryExpression
  public genPrefixUnaryExpression(node: ts.PrefixUnaryExpression): ts.Expression {
    switch (node.operator) {
      // -
      // Treat -n as 0 - n.
      case ts.SyntaxKind.MinusToken:
        return ts.createBinary(
          ts.createNumericLiteral('0'),
          ts.createToken(ts.SyntaxKind.MinusToken),
          this.genExpression(node.operand)
        );
    }
    return ts.createPrefix(node.operator, this.genExpression(node.operand));
  }

  // 204 SyntaxKind.PostfixUnaryExpression
  public genPostfixUnaryExpression(node: ts.PostfixUnaryExpression): ts.Expression {
    const operand = this.genExpression(node.operand);
    switch (node.operator) {
      // ++
      // Treat i++ as i = i + 1
      case ts.SyntaxKind.PlusPlusToken:
        return ts.createBinary(
          operand,
          ts.createToken(ts.SyntaxKind.EqualsToken),
          ts.createBinary(operand, ts.createToken(ts.SyntaxKind.PlusToken), ts.createNumericLiteral('1'))
        );
      // --
      // Treat i-- as i = i - 1
      case ts.SyntaxKind.MinusMinusToken:
        return ts.createBinary(
          operand,
          ts.createToken(ts.SyntaxKind.EqualsToken),
          ts.createBinary(operand, ts.createToken(ts.SyntaxKind.MinusToken), ts.createNumericLiteral('1'))
        );
    }
    throw new Error('Error that should never happen');
  }

  // 205 SyntaxKind.BinaryExpression
  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    const lhs = this.genExpression(node.left);
    const rhs = this.genExpression(node.right);

    switch (node.operatorToken.kind) {
      // ==
      // == is equivalent to ===. In a strict type context, type compare is irrelevant.
      case ts.SyntaxKind.EqualsEqualsToken:
        return this.genBinaryExpression(
          ts.createBinary(lhs, ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), rhs)
        );
      // !=
      // != is equivalent to !==. In a strict type context, type compare is irrelevant.
      case ts.SyntaxKind.ExclamationEqualsToken:
        return this.genBinaryExpression(
          ts.createBinary(lhs, ts.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken), rhs)
        );
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

  // 220 SyntaxKind.VariableStatement
  public genVariableDeclaration(node: ts.VariableDeclaration): ts.VariableDeclaration {
    // Make up for the missing type tags.
    //
    // Example:
    //   let a = 10;           => let a: number = 10;
    //   let a = "Hello";      => let a: string = "Hello";
    //   let a = false;        => let a: boolean = false;
    //   let a = [1, 2, 3];    => let a: number[] = [1, 2, 3];
    //   let a = new Foo();    => let a: Foo = new Foo();
    const type = (() => {
      if (node.type) {
        return node.type;
      }
      const a = this.checker.getTypeAtLocation(node.name);
      if (a.flags & ts.TypeFlags.Number) {
        return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
      }
      if (a.flags & ts.TypeFlags.String) {
        return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
      }
      if (a.flags & ts.TypeFlags.Boolean) {
        return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
      }
      if (a.flags & ts.TypeFlags.Object && a.symbol.escapedName.toString() === 'Array') {
        if ((a as any).typeArguments[0].flags & ts.TypeFlags.Number) {
          return ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword));
        }
        if ((a as any).typeArguments[0].flags & ts.TypeFlags.String) {
          return ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword));
        }
        if ((a as any).typeArguments[0].flags & ts.TypeFlags.Boolean) {
          return ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
        }
        throw new Error('Array type must be specified explicitly');
      }
      if (a.flags & ts.TypeFlags.Object && a.symbol.escapedName.toString() !== '__object') {
        const b = (node.initializer as ts.NewExpression).expression.getText();
        return ts.createTypeReferenceNode(b, undefined);
      }
      return undefined;
    })();
    return ts.createVariableDeclaration(
      node.name,
      type,
      node.initializer ? this.genExpression(node.initializer) : undefined
    );
  }

  private genCompoundAssignment(lhs: ts.Expression, rhs: ts.Expression, op: ts.BinaryOperator): ts.Expression {
    const r = ts.createBinary(lhs, ts.createToken(op), rhs);
    return ts.createBinary(lhs, ts.createToken(ts.SyntaxKind.EqualsToken), r);
  }
}

// Layer5 is a c-stdlib-based-level transformation.
class PreludeLayer5 extends Base {
  public process(): string {
    const tmpPath = path.join(this.option.tempdir, 'output.layer5.ts');
    const tmpFile = ts.createSourceFile(
      tmpPath,
      fs.readFileSync(this.option.entryfn).toString(),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const r: string[] = [];
    this.genSourceFile(this.program.getSourceFile(this.option.entryfn)!).forEach(e => {
      r.push(printer.printNode(ts.EmitHint.Unspecified, e, tmpFile));
      r.push('\n');
    });
    fs.writeFileSync(tmpPath, r.join(''));
    debug(`Expand ${this.option.entryfn} => ${tmpPath}`);
    return tmpPath;
  }

  // 190 SyntaxKind.PropertyAccessExpression
  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): ts.Expression {
    const objectType = this.checker.getTypeAtLocation(node.expression);
    if (objectType.flags & ts.TypeFlags.String || objectType.flags & ts.TypeFlags.StringLiteral) {
      if (node.name.text === 'length') {
        return ts.createCall(
          ts.createIdentifier('strlen'),
          undefined,
          ts.createNodeArray([this.genExpression(node.expression)])
        );
      }
    }
    return ts.createPropertyAccess(this.genExpression(node.expression), this.genIdentifier(node.name));
  }

  // 205 SyntaxKind.BinaryExpression
  public genBinaryExpression(node: ts.BinaryExpression): ts.Expression {
    const lhs = this.genExpression(node.left);
    const lhsType = this.checker.getTypeAtLocation(node.left);
    const rhs = this.genExpression(node.right);

    switch (node.operatorToken.kind) {
      // ===
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        // "Hello" === "Hello" => strcmp("Hello", "Hello") === 0
        if (lhsType.flags & ts.TypeFlags.String || lhsType.flags & ts.TypeFlags.StringLiteral) {
          return ts.createBinary(
            ts.createCall(ts.createIdentifier('strcmp'), undefined, ts.createNodeArray([lhs, rhs])),
            ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
            ts.createNumericLiteral('0')
          );
        }
        return ts.createBinary(lhs, node.operatorToken, rhs);
      // !==
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        // "Hello" !== "Hello" => strcmp("Hello", "Hello") !== 0
        if (lhsType.flags & ts.TypeFlags.String || lhsType.flags & ts.TypeFlags.StringLiteral) {
          return ts.createBinary(
            ts.createCall(ts.createIdentifier('strcmp'), undefined, ts.createNodeArray([lhs, rhs])),
            ts.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
            ts.createNumericLiteral('0')
          );
        }
        return ts.createBinary(lhs, node.operatorToken, rhs);
      // +
      case ts.SyntaxKind.PlusToken:
        // "Hello" + "Hello" => strcat(strcpy(malloc(a.lenght + b.length + 1), a), b)
        if (lhsType.flags & ts.TypeFlags.String || lhsType.flags & ts.TypeFlags.StringLiteral) {
          return ts.createCall(ts.createIdentifier('strcat'), undefined, [
            ts.createCall(ts.createIdentifier('strcpy'), undefined, [
              ts.createCall(ts.createIdentifier('malloc'), undefined, [
                ts.createBinary(
                  ts.createBinary(
                    ts.createCall(ts.createIdentifier('strlen'), undefined, ts.createNodeArray([lhs])),
                    ts.createToken(ts.SyntaxKind.PlusToken),
                    ts.createCall(ts.createIdentifier('strlen'), undefined, ts.createNodeArray([rhs]))
                  ),
                  ts.createToken(ts.SyntaxKind.PlusToken),
                  ts.createNumericLiteral('1')
                )
              ]),
              lhs
            ]),
            rhs
          ]);
        }
        return ts.createBinary(lhs, node.operatorToken, rhs);
    }
    return ts.createBinary(lhs, node.operatorToken, rhs);
  }
}

export default class Prelude {
  public readonly main: string;

  constructor(main: string) {
    this.main = main;
  }

  public process(): string {
    debug(`Starts ${this.main}`);
    const hash = crypto
      .createHash('md5')
      .update(fs.readFileSync(this.main))
      .digest()
      .toString('hex');
    const tempdir = path.join(shell.tempdir(), 'minits', hash);
    debug(`Create TmpDir ${tempdir}`);
    fs.mkdirSync(tempdir, { recursive: true });

    const option: Option = { entryfn: this.main, tempdir };
    option.entryfn = new PreludeLayer0(option).process();
    option.entryfn = new PreludeLayer1(option).process();
    option.entryfn = new PreludeLayer2(option).process();
    option.entryfn = new PreludeLayer3(option).process();
    option.entryfn = new PreludeLayer4(option).process();
    option.entryfn = new PreludeLayer5(option).process();
    const out = path.join(tempdir, 'output.ts');
    fs.copyFileSync(option.entryfn, out);
    return out;
  }
}
