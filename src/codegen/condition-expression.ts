import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenCondition {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genConditionalExpression(node: ts.ConditionalExpression): llvm.Value {
    const condition = this.cgen.genExpression(node.condition);
    const thenBlock = llvm.BasicBlock.create(this.cgen.context, 'if.then', this.cgen.currentFunction);
    const elseBlock = llvm.BasicBlock.create(this.cgen.context, 'if.else', this.cgen.currentFunction);
    const quitBlock = llvm.BasicBlock.create(this.cgen.context, 'if.quit', this.cgen.currentFunction);
    this.cgen.builder.createCondBr(condition, thenBlock, elseBlock);

    this.cgen.builder.setInsertionPoint(thenBlock);
    const vThen = this.cgen.genExpression(node.whenTrue);
    this.cgen.builder.createBr(quitBlock);

    this.cgen.builder.setInsertionPoint(elseBlock);
    const vElse = this.cgen.genExpression(node.whenFalse);
    this.cgen.builder.createBr(quitBlock);

    if (vThen.type.typeID !== vElse.type.typeID) {
      throw new Error('Type mismatch');
    }

    this.cgen.builder.setInsertionPoint(quitBlock);
    const phi = this.cgen.builder.createPhi(vThen.type, 2);
    phi.addIncoming(vThen, thenBlock);
    phi.addIncoming(vElse, elseBlock);
    return phi;
  }
}
