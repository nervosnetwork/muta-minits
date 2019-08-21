import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenFor {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genForStatement(node: ts.ForStatement): void {
    if (node.initializer) {
      if (ts.isVariableDeclarationList(node.initializer)) {
        node.initializer.declarations.forEach(item => {
          this.cgen.genVariableDeclaration(item);
        });
      } else {
        throw new Error('Unsupported for statement');
      }
    }
    const loopCond = llvm.BasicBlock.create(this.cgen.context, 'loop.cond', this.cgen.currentFunction);
    const loopBody = llvm.BasicBlock.create(this.cgen.context, 'loop.body', this.cgen.currentFunction);
    const loopIncr = llvm.BasicBlock.create(this.cgen.context, 'loop.incr', this.cgen.currentFunction);
    const loopQuit = llvm.BasicBlock.create(this.cgen.context, 'loop.quit', this.cgen.currentFunction);

    this.cgen.builder.createBr(loopCond);
    this.cgen.builder.setInsertionPoint(loopCond);
    const cond = this.cgen.genExpression(node.condition!);
    this.cgen.builder.createCondBr(cond, loopBody, loopQuit);

    this.cgen.builder.setInsertionPoint(loopBody);
    const rawBreakBlock = this.cgen.currentBreakBlock;
    const rawContinueBlock = this.cgen.currentConitnueBlock;
    this.cgen.currentBreakBlock = loopQuit;
    this.cgen.currentConitnueBlock = loopIncr;
    this.cgen.genStatement(node.statement);
    this.cgen.builder.createBr(loopIncr);

    this.cgen.builder.setInsertionPoint(loopIncr);
    if (node.incrementor) {
      this.cgen.genExpression(node.incrementor);
    }
    this.cgen.builder.createBr(loopCond);

    this.cgen.builder.setInsertionPoint(loopQuit);
    this.cgen.currentBreakBlock = rawBreakBlock;
    this.cgen.currentConitnueBlock = rawContinueBlock;
  }
}
