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
    const loopCond = this.cgen.genExpression(node.condition!);
    this.cgen.builder.createCondBr(loopCond, loopBody, loopQuit);

    this.cgen.builder.setInsertionPoint(loopBody);
    const rawBreakBlock = this.cgen.currentBreakBlock;
    this.cgen.currentBreakBlock = loopQuit;
    this.cgen.genStatement(node.statement);
    if (node.incrementor) {
      this.cgen.genExpression(node.incrementor);
    }
    this.cgen.builder.createBr(loopHeader);

    this.cgen.builder.setInsertionPoint(loopQuit);
    this.cgen.currentBreakBlock = rawBreakBlock;
  }
}
