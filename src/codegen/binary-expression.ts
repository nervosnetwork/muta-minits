import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenBinary {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genBinaryExpression(expr: ts.BinaryExpression): llvm.Value {
    const lhs = (() => {
      if (expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        return this.genSymbolPtr(expr.left);
      }
      return this.cgen.genExpression(expr.left);
    })();
    const rhs = this.cgen.genExpression(expr.right);

    switch (expr.operatorToken.kind) {
      // <
      case ts.SyntaxKind.LessThanToken:
        return this.cgen.builder.createICmpSLT(lhs, rhs);
      // >
      case ts.SyntaxKind.GreaterThanToken:
        return this.cgen.builder.createICmpSGT(lhs, rhs);
      // <=
      case ts.SyntaxKind.LessThanEqualsToken:
        return this.cgen.builder.createICmpSLE(lhs, rhs);
      // >=
      case ts.SyntaxKind.GreaterThanEqualsToken:
        return this.cgen.builder.createICmpSGE(lhs, rhs);
      // ==
      case ts.SyntaxKind.EqualsEqualsToken:
        return this.cgen.builder.createICmpEQ(lhs, rhs);
      // !=
      case ts.SyntaxKind.ExclamationEqualsToken:
        return this.cgen.builder.createICmpNE(lhs, rhs);
      // ===
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        if (this.cgen.cgString.isStringLiteral(expr.left)) {
          return this.cgen.cgString.eq(lhs, rhs);
        }
        return this.cgen.builder.createICmpEQ(lhs, rhs);
      // !==
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        if (this.cgen.cgString.isStringLiteral(expr.left)) {
          return this.cgen.cgString.ne(lhs, rhs);
        }
        return this.cgen.builder.createICmpNE(lhs, rhs);
      // +
      case ts.SyntaxKind.PlusToken:
        if (this.cgen.cgString.isStringLiteral(expr.left)) {
          return this.cgen.cgString.concat(lhs, rhs);
        }
        return this.cgen.builder.createAdd(lhs, rhs);
      // -
      case ts.SyntaxKind.MinusToken:
        return this.cgen.builder.createSub(lhs, rhs);
      // *
      case ts.SyntaxKind.AsteriskToken:
        return this.cgen.builder.createMul(lhs, rhs);
      // /
      case ts.SyntaxKind.SlashToken:
        return this.cgen.builder.createSDiv(lhs, rhs);
      // %
      case ts.SyntaxKind.PercentToken:
        return this.cgen.builder.createSRem(lhs, rhs);
      // <<
      case ts.SyntaxKind.LessThanLessThanToken:
        return this.cgen.builder.createShl(lhs, rhs);
      // >>
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
        return this.cgen.builder.createAShr(lhs, rhs);
      // >>>
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
        return this.cgen.builder.createLShr(lhs, rhs);
      // &
      case ts.SyntaxKind.AmpersandToken:
        return this.cgen.builder.createAnd(lhs, rhs);
      // |
      case ts.SyntaxKind.BarToken:
        return this.cgen.builder.createOr(lhs, rhs);
      // ^
      case ts.SyntaxKind.CaretToken:
        return this.cgen.builder.createXor(lhs, rhs);
      // &&
      case ts.SyntaxKind.AmpersandAmpersandToken:
        const aaInitBlock = this.cgen.builder.getInsertBlock()!;
        const aaNextBlock = llvm.BasicBlock.create(this.cgen.context, 'next', this.cgen.currentFunction);
        const aaQuitBlock = llvm.BasicBlock.create(this.cgen.context, 'quit', this.cgen.currentFunction);
        this.cgen.builder.createCondBr(lhs, aaNextBlock, aaQuitBlock);
        this.cgen.builder.setInsertionPoint(aaNextBlock);
        this.cgen.builder.createBr(aaQuitBlock);
        this.cgen.builder.setInsertionPoint(aaQuitBlock);
        const aaPhi = this.cgen.builder.createPhi(llvm.Type.getInt1Ty(this.cgen.context), 2);
        aaPhi.addIncoming(llvm.ConstantInt.get(this.cgen.context, 0, 1), aaInitBlock);
        aaPhi.addIncoming(rhs, aaNextBlock);
        return aaPhi;
      // ||
      case ts.SyntaxKind.BarBarToken:
        const bbInitBlock = this.cgen.builder.getInsertBlock()!;
        const bbNextBlock = llvm.BasicBlock.create(this.cgen.context, 'next', this.cgen.currentFunction);
        const bbQuitBlock = llvm.BasicBlock.create(this.cgen.context, 'quit', this.cgen.currentFunction);
        this.cgen.builder.createCondBr(lhs, bbQuitBlock, bbNextBlock);
        this.cgen.builder.setInsertionPoint(bbNextBlock);
        this.cgen.builder.createBr(bbQuitBlock);
        this.cgen.builder.setInsertionPoint(bbQuitBlock);
        const bbPhi = this.cgen.builder.createPhi(llvm.Type.getInt1Ty(this.cgen.context), 2);
        bbPhi.addIncoming(llvm.ConstantInt.get(this.cgen.context, 1, 1), bbInitBlock);
        bbPhi.addIncoming(rhs, bbNextBlock);
        return bbPhi;
      // =
      case ts.SyntaxKind.EqualsToken:
        if (expr.left.kind === ts.SyntaxKind.ElementAccessExpression) {
          const e = (expr.left as ts.ElementAccessExpression).expression;
          const type = this.cgen.checker.getTypeAtLocation(e);
          if (type.symbol.escapedName === 'Int8Array') {
            const v = this.cgen.builder.createIntCast(rhs, llvm.Type.getInt8Ty(this.cgen.context), true);
            return this.cgen.builder.createStore(v, lhs);
          }
        }
        return this.cgen.builder.createStore(rhs, lhs);
      default:
        throw new Error('Error that should never happen');
    }
  }

  public genSymbolPtr(node: ts.Expression): llvm.Value {
    switch (node.kind) {
      case ts.SyntaxKind.Identifier:
        return (this.cgen.symtab.get((node as ts.Identifier).getText()) as symtab.Leaf).data;
      case ts.SyntaxKind.ElementAccessExpression:
        return this.cgen.cgArray.genElementAccessExpressionPtr(node as ts.ElementAccessExpression);
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.cgen.genPropertyAccessExpressionPtr(node as ts.PropertyAccessExpression);
      default:
        throw new Error(`Unsupported grammar ${node.kind}`);
    }
  }
}
