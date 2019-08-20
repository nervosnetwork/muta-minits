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
    const loopCond1 = this.cgen.genExpression(node.condition!);
    this.cgen.builder.createCondBr(loopCond1, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopBody);
    this.cgen.genStatement(node.statement);

    // Loop End
    if (node.incrementor) {
      this.cgen.genExpression(node.incrementor);
    }
    const loopCond2 = this.cgen.genExpression(node.condition!);
    this.cgen.builder.createCondBr(loopCond2, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopQuit);
  }
}
