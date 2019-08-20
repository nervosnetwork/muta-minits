import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import Symtab from '../symtab';
import CodeGenArray from './array-literal-expression';
import CodeGenBinary from './binary-expression';
import CodeGenForOf from './for-of-statement';
import CodeGenFor from './for-statement';
import CodeGenFuncDecl from './function-declaration';
import CodeGenIf from './if-statement';
import CodeGenPostfixUnary from './postfix-unary-expression';
import CodeGenPrefixUnary from './prefix-unary-expression';
import CodeGenReturn from './return-statement';
import CodeGenVarDecl from './variable-declaration';

const debug = Debug('minits:codegen');

debug('codegen');

export default class LLVMCodeGen {
  public readonly builder: llvm.IRBuilder;
  public readonly context: llvm.LLVMContext;
  public readonly module: llvm.Module;
  public readonly symtab: Symtab;

  public readonly cgArray: CodeGenArray;
  public readonly cgBinary: CodeGenBinary;
  public readonly cgForOf: CodeGenForOf;
  public readonly cgFor: CodeGenFor;
  public readonly cgFuncDecl: CodeGenFuncDecl;
  public readonly cgIf: CodeGenIf;
  public readonly cgPostfixUnary: CodeGenPostfixUnary;
  public readonly cgPrefixUnary: CodeGenPrefixUnary;
  public readonly cgReturn: CodeGenReturn;
  public readonly cgVarDecl: CodeGenVarDecl;

  public currentFunction: llvm.Function | undefined;
  public currentType: ts.TypeNode | undefined;

  constructor() {
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module('main', this.context);
    this.builder = new llvm.IRBuilder(this.context);
    this.symtab = new Symtab();

    this.cgArray = new CodeGenArray(this);
    this.cgBinary = new CodeGenBinary(this);
    this.cgForOf = new CodeGenForOf(this);
    this.cgFor = new CodeGenFor(this);
    this.cgFuncDecl = new CodeGenFuncDecl(this);
    this.cgIf = new CodeGenIf(this);
    this.cgPostfixUnary = new CodeGenPostfixUnary(this);
    this.cgPrefixUnary = new CodeGenPrefixUnary(this);
    this.cgReturn = new CodeGenReturn(this);
    this.cgVarDecl = new CodeGenVarDecl(this);

    this.currentFunction = undefined;
    this.currentType = undefined;
  }

  public genText(): string {
    return this.module.print();
  }

  public genSourceFile(sourceFile: ts.SourceFile): void {
    sourceFile.forEachChild(node => {
      switch (node.kind) {
        case ts.SyntaxKind.EndOfFileToken:
          return;
        case ts.SyntaxKind.VariableStatement:
          this.genVariableStatement(node as ts.VariableStatement);
          break;
        case ts.SyntaxKind.FunctionDeclaration:
          this.genFunctionDeclaration(node as ts.FunctionDeclaration);
          break;
        default:
          throw new Error('Unsupported grammar');
      }
    });
  }

  public genNumeric(node: ts.NumericLiteral): llvm.ConstantInt {
    const text = node.getText();
    const bits = (() => {
      if (text.startsWith('0x')) {
        return 16;
      } else {
        return 10;
      }
    })();
    return llvm.ConstantInt.get(this.context, parseInt(text, bits), 64);
  }

  public genBoolean(node: ts.BooleanLiteral): llvm.ConstantInt {
    switch (node.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return llvm.ConstantInt.get(this.context, 0, 1);
      case ts.SyntaxKind.TrueKeyword:
        return llvm.ConstantInt.get(this.context, 1, 1);
      default:
        throw new Error('Unsupported boolean value');
    }
  }

  public genIdentifier(node: ts.Identifier): llvm.Value {
    return this.symtab.get(node.getText());
  }

  public genAutoDereference(node: llvm.Value): llvm.Value {
    if (node.type.isPointerTy()) {
      return this.builder.createLoad(node);
    }
    return node;
  }

  public genType(type: ts.TypeNode): llvm.Type {
    switch (type.kind) {
      case ts.SyntaxKind.BooleanKeyword:
        return llvm.Type.getInt1Ty(this.context);
      case ts.SyntaxKind.NumberKeyword:
        return llvm.Type.getInt64Ty(this.context);
      default:
        throw new Error('Unsupported type');
    }
  }

  public genBlock(node: ts.Block): void {
    node.statements.forEach(b => {
      this.genStatement(b);
    });
  }

  public genExpression(expr: ts.Expression): llvm.Value {
    switch (expr.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumeric(expr as ts.NumericLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(expr as ts.Identifier);
      case ts.SyntaxKind.FalseKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral);
      case ts.SyntaxKind.TrueKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genArrayLiteral(expr as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.genElementAccess(expr as ts.ElementAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.genCallExpression(expr as ts.CallExpression);
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.genPrefixUnaryExpression(expr as ts.PrefixUnaryExpression);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.genPostfixUnaryExpression(
          expr as ts.PostfixUnaryExpression
        );
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(expr as ts.BinaryExpression);
      default:
        throw new Error('Unsupported expression');
    }
  }

  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.AllocaInst {
    return this.cgArray.genArrayLiteral(node);
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    return this.cgArray.genArrayElementAccess(node);
  }

  public genCallExpression(expr: ts.CallExpression): llvm.Value {
    const name = expr.expression.getText();
    const args = expr.arguments.map(item => {
      return this.genExpression(item);
    });
    const func = this.module.getFunction(name)!;
    return this.builder.createCall(func, args);
  }

  public genPrefixUnaryExpression(node: ts.PrefixUnaryExpression): llvm.Value {
    return this.cgPrefixUnary.genPrefixUnaryExpression(node);
  }

  public genPostfixUnaryExpression(
    node: ts.PostfixUnaryExpression
  ): llvm.Value {
    return this.cgPostfixUnary.genPostfixUnaryExpression(node);
  }

  public genBinaryExpression(node: ts.BinaryExpression): llvm.Value {
    return this.cgBinary.genBinaryExpression(node)
  }

  public genStatement(node: ts.Statement): llvm.Value | void {
    switch (node.kind) {
      case ts.SyntaxKind.Block:
        return this.genBlock(node as ts.Block);
      case ts.SyntaxKind.VariableStatement:
        return this.genVariableStatement(node as ts.VariableStatement);
      case ts.SyntaxKind.ExpressionStatement:
        return this.genExpressionStatement(node as ts.ExpressionStatement);
      case ts.SyntaxKind.IfStatement:
        return this.genIfStatement(node as ts.IfStatement);
      case ts.SyntaxKind.ForStatement:
        return this.genForStatement(node as ts.ForStatement);
      case ts.SyntaxKind.ForOfStatement:
        return this.genForOfStatement(node as ts.ForOfStatement);
      case ts.SyntaxKind.ReturnStatement:
        return this.genReturnStatement(node as ts.ReturnStatement);
      default:
        throw new Error('Unsupported statement');
    }
  }

  public genVariableDeclaration(node: ts.VariableDeclaration): llvm.Value {
    return this.cgVarDecl.genVariableDeclaration(node);
  }

  public genVariableStatement(node: ts.VariableStatement): void {
    node.declarationList.declarations.forEach(item => {
      this.genVariableDeclaration(item);
    });
  }

  public genExpressionStatement(node: ts.ExpressionStatement): llvm.Value {
    return this.genExpression(node.expression);
  }

  public genReturnStatement(node: ts.ReturnStatement): llvm.Value {
    return this.cgReturn.genReturnStatement(node);
  }

  public genFunctionDeclaration(node: ts.FunctionDeclaration): llvm.Function {
    return this.cgFuncDecl.genFunctionDeclaration(node);
  }

  public genIfStatement(node: ts.IfStatement): void {
    return this.cgIf.genIfStatement(node);
  }

  public genForStatement(node: ts.ForStatement): void {
    return this.cgFor.genForStatement(node);
  }

  public genForOfStatement(node: ts.ForOfStatement): void {
    return this.cgForOf.genForOfStatement(node);
  }
}
