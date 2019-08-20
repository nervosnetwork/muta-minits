import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenWhile {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genWhileStatement(node: ts.WhileStatement): void {
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
    // Loop Header
    const loopCond1 = this.cgen.genExpression(node.expression);
    this.cgen.builder.createCondBr(loopCond1, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopBody);

    // Loop Body
    const rawBreakBlock = this.cgen.currentBreakBlock;
    this.cgen.currentBreakBlock = loopQuit;
    this.cgen.genStatement(node.statement);

    // Loop End
    const loopCond2 = this.cgen.genExpression(node.expression);
    this.cgen.builder.createCondBr(loopCond2, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopQuit);
    this.cgen.currentBreakBlock = rawBreakBlock;
  }
}
