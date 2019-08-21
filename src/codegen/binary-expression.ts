import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

const CompoundAssignmentOperator = [
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken
];
const AssignmentOperator = [ts.SyntaxKind.EqualsToken].concat(CompoundAssignmentOperator);

export default class CodeGenBinary {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genBinaryExpression(expr: ts.BinaryExpression): llvm.Value {
    const lhs = (() => {
      const val = this.cgen.genExpression(expr.left);
      if (AssignmentOperator.includes(expr.operatorToken.kind)) {
        return val;
      }
      return this.cgen.genAutoDereference(val);
    })();
    const rhs = this.cgen.genAutoDereference(this.cgen.genExpression(expr.right));

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
        return this.cgen.builder.createICmpEQ(lhs, rhs);
      // !==
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        return this.cgen.builder.createICmpNE(lhs, rhs);
      // +
      case ts.SyntaxKind.PlusToken:
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
        return this.cgen.builder.createStore(rhs, lhs);
      // +=
      case ts.SyntaxKind.PlusEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createAdd(l, r));
      // -=
      case ts.SyntaxKind.MinusEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createSub(l, r));
      // *=
      case ts.SyntaxKind.AsteriskEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createMul(l, r));
      // /=
      case ts.SyntaxKind.SlashEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createSDiv(l, r));
      // %=
      case ts.SyntaxKind.PercentEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createSRem(l, r));
      // <<=
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createShl(l, r));
      // &=
      case ts.SyntaxKind.AmpersandEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createAnd(l, r));
      // |=
      case ts.SyntaxKind.BarEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createOr(l, r));
      // ^=
      case ts.SyntaxKind.CaretEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createXor(l, r));
      // >>=
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createAShr(l, r));
      // >>>=
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        return this.genCompoundAssignment(lhs, rhs, (l, r) => this.cgen.builder.createLShr(l, r));
      default:
        throw new Error('Unsupported binary expression');
    }
  }

  public genCompoundAssignment(
    lhs: llvm.Value,
    rhs: llvm.Value,
    cb: (lhs: llvm.Value, rhs: llvm.Value) => llvm.Value
  ): llvm.Value {
    const realLHS = this.cgen.builder.createLoad(lhs);
    const realRHS = rhs.type.isPointerTy() ? this.cgen.builder.createLoad(rhs) : rhs;

    const result = cb(realLHS, realRHS);
    this.cgen.builder.createStore(result, lhs);
    return lhs;
  }
}
