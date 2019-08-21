import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenWhile {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genWhileStatement(node: ts.WhileStatement): void {
    const loopHeader = llvm.BasicBlock.create(
      this.cgen.context,
      'loop.header',
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

    this.cgen.builder.createBr(loopHeader);
    this.cgen.builder.setInsertionPoint(loopHeader);
    const loopCond = this.cgen.genExpression(node.expression);
    this.cgen.builder.createCondBr(loopCond, loopBody, loopQuit);

    this.cgen.builder.setInsertionPoint(loopBody);
    const rawBreakBlock = this.cgen.currentBreakBlock;
    this.cgen.currentBreakBlock = loopQuit;
    this.cgen.genStatement(node.statement);
    this.cgen.builder.createBr(loopHeader);

    this.cgen.builder.setInsertionPoint(loopQuit);
    this.cgen.currentBreakBlock = rawBreakBlock;
  }
}
