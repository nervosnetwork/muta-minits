import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenWhile {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genWhileStatement(node: ts.WhileStatement): void {
    const loopCond = llvm.BasicBlock.create(
      this.cgen.context,
      'loop.cond',
      this.cgen.currentFunction
    );
    const loopBody = llvm.BasicBlock.create(
      this.cgen.context,
      'loop.body',
      this.cgen.currentFunction
    );
    const loopQuit = llvm.BasicBlock.create(
      this.cgen.context,
      'loop.quit',
      this.cgen.currentFunction
    );

    this.cgen.builder.createBr(loopCond);
    this.cgen.builder.setInsertionPoint(loopCond);
    const cond = this.cgen.genExpression(node.expression);
    this.cgen.builder.createCondBr(cond, loopBody, loopQuit);

    this.cgen.builder.setInsertionPoint(loopBody);
    const rawBreakBlock = this.cgen.currentBreakBlock;
    const rawContinueBlock = this.cgen.currentConitnueBlock;
    this.cgen.currentBreakBlock = loopQuit;
    this.cgen.currentConitnueBlock = loopCond;
    this.cgen.genStatement(node.statement);
    this.cgen.builder.createBr(loopCond);

    this.cgen.builder.setInsertionPoint(loopQuit);
    this.cgen.currentBreakBlock = rawBreakBlock;
    this.cgen.currentConitnueBlock = rawContinueBlock;
  }
}
