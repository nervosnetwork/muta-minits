import llvm from 'llvm-node';
import ts from 'typescript';

import Symtab from './symtab';

export default class LLVMCodeGen {
  public readonly builder: llvm.IRBuilder;
  public readonly context: llvm.LLVMContext;
  public readonly module: llvm.Module;
  public readonly symtab: Symtab;

  private currentFunction: llvm.Function | undefined;

  constructor() {
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module('main', this.context);
    this.builder = new llvm.IRBuilder(this.context);
    this.symtab = new Symtab();
    this.currentFunction = undefined;
  }

  public genText(): string {
    return this.module.print();
  }

  public genSourceFile(sourceFile: ts.SourceFile): void {
    sourceFile.forEachChild(node => this.genNode(node));
  }

  public genNode(
    node: ts.Node
  ): llvm.Constant | llvm.Type | llvm.Value | undefined | void {
    switch (node.kind) {
      case ts.SyntaxKind.EndOfFileToken:
        return;
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumeric(node as ts.NumericLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(node as ts.Identifier);
      case ts.SyntaxKind.FalseKeyword:
        return this.genBoolean(node as ts.BooleanLiteral);
      case ts.SyntaxKind.TrueKeyword:
        return this.genBoolean(node as ts.BooleanLiteral);
      case ts.SyntaxKind.CallExpression:
        return this.genCallExpression(node as ts.CallExpression);
      case ts.SyntaxKind.BooleanKeyword:
        return this.genType(node as ts.TypeNode);
      case ts.SyntaxKind.NumberKeyword:
        return this.genType(node as ts.TypeNode);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.genExpression(node as ts.PostfixUnaryExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(node as ts.BinaryExpression);
      case ts.SyntaxKind.Block:
        return this.genStatement(node as ts.Block);
      case ts.SyntaxKind.VariableStatement:
        return this.genStatement(node as ts.Statement);
      case ts.SyntaxKind.ExpressionStatement:
        return this.genStatement(node as ts.Statement);
      case ts.SyntaxKind.IfStatement:
        return this.genStatement(node as ts.Statement);
      case ts.SyntaxKind.ReturnStatement:
        return this.genStatement(node as ts.Statement);
      case ts.SyntaxKind.FunctionDeclaration:
        return this.genFunctionDeclaration(node as ts.FunctionDeclaration);
      default:
        throw new Error('Unsupported grammar');
    }
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
        throw new Error('Unsupported grammar');
    }
  }

  public genIdentifier(node: ts.Identifier): llvm.Value {
    const p = this.symtab.get(node.getText());
    if (p.type.isPointerTy()) {
      return this.builder.createLoad(p, node.getText());
    } else {
      return p;
    }
  }

  public genType(type: ts.TypeNode): llvm.Type {
    switch (type.kind) {
      case ts.SyntaxKind.BooleanKeyword:
        return llvm.Type.getInt1Ty(this.context);
      case ts.SyntaxKind.NumberKeyword:
        return llvm.Type.getInt64Ty(this.context);
      default:
        throw new Error('Unsupported grammar');
    }
  }

  public genBlock(node: ts.Block): void {
    node.statements.forEach(function (this: LLVMCodeGen, b: ts.Statement): void {
      this.genStatement(b);
    }, this);
  }

  public genExpression(expr: ts.Expression): llvm.Value {
    switch (expr.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumeric(expr as ts.NumericLiteral);
      case ts.SyntaxKind.Identifier:
        return this.genIdentifier(expr as ts.Identifier);
      case ts.SyntaxKind.FalseKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral)
      case ts.SyntaxKind.TrueKeyword:
        return this.genBoolean(expr as ts.BooleanLiteral);
      case ts.SyntaxKind.CallExpression:
        return this.genCallExpression(expr as ts.CallExpression);
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.genPrefixUnaryExpression(
          expr as ts.PrefixUnaryExpression
        );
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.genPostfixUnaryExpression(
          expr as ts.PostfixUnaryExpression
        );
      case ts.SyntaxKind.BinaryExpression:
        return this.genBinaryExpression(expr as ts.BinaryExpression);
      default:
        throw new Error('Unsupported grammar');
    }
  }

  public genCallExpression(expr: ts.CallExpression): llvm.Value {
    const name = expr.expression.getText();
    const args = expr.arguments.map(item => {
      return this.genExpression(item);
    });
    const func = this.module.getFunction(name)!;
    return this.builder.createCall(func, args);
  }

  public genPrefixUnaryExpression(expr: ts.PrefixUnaryExpression): llvm.Value {
    switch (expr.operator) {
      case ts.SyntaxKind.TildeToken:
        return this.builder.createXor(this.genExpression(expr.operand), llvm.ConstantInt.get(this.context, -1, 64));
      default:
        throw new Error('Unsupported grammar');
    }
  }

  public genPostfixUnaryExpression(
    expr: ts.PostfixUnaryExpression
  ): llvm.Value {
    const e = expr.operand as ts.Expression;
    const lhs = this.genExpression(e);
    switch (expr.operator) {
      case ts.SyntaxKind.PlusPlusToken:
        const rpp = this.builder.createAdd(
          lhs,
          llvm.ConstantInt.get(this.context, 1, 64)
        );
        this.symtab.set(e.getText(), rpp);
        return lhs;
      case ts.SyntaxKind.MinusMinusToken:
        const rmm = this.builder.createSub(
          lhs,
          llvm.ConstantInt.get(this.context, 1, 64)
        );
        this.symtab.set(e.getText(), rmm);
        return lhs;
      default:
        throw new Error('Unsupported grammar');
    }
  }

  public genBinaryExpression(expr: ts.BinaryExpression): llvm.Value {
    const lhs = (() => {
      if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
        return this.genExpression(expr.left);
      } else {
        return this.symtab.get(expr.left.getText());
      }
    })();
    const rhs = this.genExpression(expr.right);

    switch (expr.operatorToken.kind) {
      case ts.SyntaxKind.LessThanToken: // <
        return this.builder.createICmpSLT(lhs, rhs);
      case ts.SyntaxKind.GreaterThanToken: // >
        return this.builder.createICmpSGT(lhs, rhs);
      case ts.SyntaxKind.LessThanEqualsToken: // <=
        return this.builder.createICmpSLE(lhs, rhs);
      case ts.SyntaxKind.GreaterThanEqualsToken: // >=
        return this.builder.createICmpSGE(lhs, rhs);
      case ts.SyntaxKind.EqualsEqualsToken: // ==
        return this.builder.createICmpEQ(lhs, rhs);
      case ts.SyntaxKind.ExclamationEqualsToken: // !=
        return this.builder.createICmpNE(lhs, rhs);
      case ts.SyntaxKind.EqualsEqualsEqualsToken: // ===
        return this.builder.createICmpEQ(lhs, rhs);
      case ts.SyntaxKind.ExclamationEqualsEqualsToken: // !==
        return this.builder.createICmpNE(lhs, rhs);
      case ts.SyntaxKind.PlusToken: // +
        return this.builder.createAdd(lhs, rhs);
      case ts.SyntaxKind.MinusToken: // -
        return this.builder.createSub(lhs, rhs);
      case ts.SyntaxKind.AsteriskToken: // *
        return this.builder.createMul(lhs, rhs);
      case ts.SyntaxKind.SlashToken: // /
        return this.builder.createSDiv(lhs, rhs);
      case ts.SyntaxKind.PercentToken: // %
        return this.builder.createSRem(lhs, rhs);
      case ts.SyntaxKind.LessThanLessThanToken: // <<
        return this.builder.createShl(lhs, rhs);
      case ts.SyntaxKind.AmpersandToken: // &
        return this.builder.createAnd(lhs, rhs);
      case ts.SyntaxKind.BarToken: // |
        return this.builder.createOr(lhs, rhs);
      case ts.SyntaxKind.CaretToken: // ^
        return this.builder.createXor(lhs, rhs);
      case ts.SyntaxKind.AmpersandAmpersandToken: // &&
        const aaInitBlock = this.builder.getInsertBlock()!;
        const aaNextBlock = llvm.BasicBlock.create(this.context, 'next', this.currentFunction);
        const aaQuitBlock = llvm.BasicBlock.create(this.context, 'quit', this.currentFunction);
        this.builder.createCondBr(lhs, aaNextBlock, aaQuitBlock);
        this.builder.setInsertionPoint(aaNextBlock);
        this.builder.createBr(aaQuitBlock);
        this.builder.setInsertionPoint(aaQuitBlock);
        const aaPhi = this.builder.createPhi(llvm.Type.getInt1Ty(this.context), 2);
        aaPhi.addIncoming(llvm.ConstantInt.get(this.context, 0, 1), aaInitBlock);
        aaPhi.addIncoming(rhs, aaNextBlock);
        return aaPhi;
      case ts.SyntaxKind.BarBarToken: // ||
        const bbInitBlock = this.builder.getInsertBlock()!;
        const bbNextBlock = llvm.BasicBlock.create(this.context, 'next', this.currentFunction);
        const bbQuitBlock = llvm.BasicBlock.create(this.context, 'quit', this.currentFunction);
        this.builder.createCondBr(lhs, bbQuitBlock, bbNextBlock);
        this.builder.setInsertionPoint(bbNextBlock);
        this.builder.createBr(bbQuitBlock);
        this.builder.setInsertionPoint(bbQuitBlock);
        const bbPhi = this.builder.createPhi(llvm.Type.getInt1Ty(this.context), 2);
        bbPhi.addIncoming(llvm.ConstantInt.get(this.context, 1, 1), bbInitBlock);
        bbPhi.addIncoming(rhs, bbNextBlock);
        return bbPhi;
      case ts.SyntaxKind.EqualsToken: // =
        return this.builder.createStore(rhs, lhs);
      case ts.SyntaxKind.GreaterThanGreaterThanToken: // >>
        return this.builder.createAShr(lhs, rhs);
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken: // >>>
        return this.builder.createLShr(lhs, rhs);
      default:
        throw new Error('Unsupported grammar');
    }
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
      case ts.SyntaxKind.ReturnStatement:
        return this.genReturnStatement(node as ts.ReturnStatement);
      default:
        throw new Error('Unsupported grammar');
    }
  }

  public genVariableStatement(node: ts.VariableStatement): void {
    node.declarationList.declarations.forEach(function (
      this: LLVMCodeGen,
      item
    ): llvm.Value {
      const name = item.name.getText();
      const initializer = this.genExpression(item.initializer!);
      const type = this.genType(item.type!);

      if (this.symtab.depths() == 0) {
        // Global variables
        const r = new llvm.GlobalVariable(this.module, type, false, llvm.LinkageTypes.ExternalLinkage, initializer as llvm.Constant, name);
        this.symtab.set(name, r);
        return r;
      } else {
        // Locale variables
        const alloca = this.builder.createAlloca(type, undefined, name);
        this.builder.createStore(initializer, alloca);
        this.symtab.set(name, alloca);
        return alloca;
      }
    },
      this);
  }

  public genExpressionStatement(node: ts.ExpressionStatement): llvm.Value {
    return this.genExpression(node.expression);
  }

  public genReturnStatement(node: ts.ReturnStatement): llvm.Value {
    if (node.expression) {
      return this.builder.createRet(this.genExpression(node.expression));
    } else {
      return this.builder.createRetVoid();
    }
  }

  public genFunctionDeclaration(node: ts.FunctionDeclaration): llvm.Function {
    const funcReturnType = this.genType(node.type!);
    const funcArgsType = node.parameters.map(item => {
      return this.genType(item.type!);
    });
    const fnty = llvm.FunctionType.get(funcReturnType, funcArgsType, false);
    const name = (() => {
      if (node.name) {
        const real = node.name as ts.Identifier;
        return real.getText();
      } else {
        return undefined;
      }
    })();
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const func = llvm.Function.create(fnty, linkage, name, this.module);

    this.symtab.into(name!);
    func.getArguments().forEach(item => {
      item.name = node.parameters[item.argumentNumber].name.getText();
      this.symtab.set(item.name, item);
    });
    if (node.body) {
      const body = llvm.BasicBlock.create(this.context, 'body', func);
      this.currentFunction = func;
      this.builder.setInsertionPoint(body);
      this.genBlock(node.body);
    }
    this.symtab.exit()
    return func;
  }

  public genIfStatement(node: ts.IfStatement): void {
    const condition = this.genExpression(node.expression);
    const thenBlock = llvm.BasicBlock.create(
      this.context,
      'then',
      this.currentFunction
    );
    const elseBlock = llvm.BasicBlock.create(
      this.context,
      'else',
      this.currentFunction
    );
    const quitBlock = llvm.BasicBlock.create(
      this.context,
      'quit',
      this.currentFunction
    );
    this.builder.createCondBr(condition, thenBlock, elseBlock);

    this.builder.setInsertionPoint(thenBlock);
    this.genStatement(node.thenStatement);
    if (!thenBlock.getTerminator()) {
      this.builder.createBr(quitBlock);
    }
    this.builder.setInsertionPoint(elseBlock);
    if (node.elseStatement) {
      this.genStatement(node.elseStatement);
    }
    if (!elseBlock.getTerminator()) {
      this.builder.createBr(quitBlock);
    }
    this.builder.setInsertionPoint(quitBlock);
  }
}
