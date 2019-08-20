import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenIf {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genIfStatement(node: ts.IfStatement): void {
    const condition = this.cgen.genExpression(node.expression);
    const thenBlock = llvm.BasicBlock.create(
      this.cgen.context,
      'if.then',
      this.cgen.currentFunction
    );
    const elseBlock = llvm.BasicBlock.create(
      this.cgen.context,
      'if.else',
      this.cgen.currentFunction
    );
    const quitBlock = llvm.BasicBlock.create(
      this.cgen.context,
      'if.quit',
      this.cgen.currentFunction
    );
    this.cgen.builder.createCondBr(condition, thenBlock, elseBlock);

    this.cgen.builder.setInsertionPoint(thenBlock);
    this.cgen.genStatement(node.thenStatement);
    if (!thenBlock.getTerminator()) {
      this.cgen.builder.createBr(quitBlock);
    }
    this.cgen.builder.setInsertionPoint(elseBlock);
    if (node.elseStatement) {
      this.cgen.genStatement(node.elseStatement);
    }
    if (!elseBlock.getTerminator()) {
      this.cgen.builder.createBr(quitBlock);
    }
    this.cgen.builder.setInsertionPoint(quitBlock);
  }
}
