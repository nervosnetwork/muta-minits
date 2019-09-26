import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenForOf {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genForOfStatement(node: ts.ForOfStatement): void {
    const pi = (() => {
      const name = 'loop.i';
      const initializer = llvm.ConstantInt.get(this.cgen.context, 0, 64);
      const type = initializer.type;
      const alloca = this.cgen.builder.createAlloca(type, undefined, name);
      this.cgen.builder.createStore(initializer, alloca);
      this.cgen.symtab.set(name, new symtab.LLVMValue(alloca, 1));
      return alloca;
    })();
    const identifier = this.cgen.genExpression(node.expression) as llvm.AllocaInst;
    const pv = (() => {
      const type = (identifier.type.elementType as llvm.ArrayType).elementType;
      const name = (node.initializer! as ts.VariableDeclarationList).declarations!.map(item => item.getText())[0];
      const alloca = this.cgen.builder.createAlloca(type, undefined, name);
      this.cgen.symtab.set(name, new symtab.LLVMValue(alloca, 1));
      return alloca;
    })();
    const loopCond = llvm.BasicBlock.create(this.cgen.context, 'loop.cond', this.cgen.currentFunction);
    const loopBody = llvm.BasicBlock.create(this.cgen.context, 'loop.body', this.cgen.currentFunction);
    const loopIncr = llvm.BasicBlock.create(this.cgen.context, 'loop.incr', this.cgen.currentFunction);
    const loopQuit = llvm.BasicBlock.create(this.cgen.context, 'loop.quit', this.cgen.currentFunction);

    this.cgen.builder.createBr(loopCond);
    const l = llvm.ConstantInt.get(this.cgen.context, (identifier.type.elementType as llvm.ArrayType).numElements, 64);
    this.cgen.builder.setInsertionPoint(loopCond);
    const cond = this.cgen.builder.createICmpSLT(this.cgen.builder.createLoad(pi), l);
    this.cgen.builder.createCondBr(cond, loopBody, loopQuit);

    this.cgen.builder.setInsertionPoint(loopBody);
    const v = this.cgen.cgArray.getElementAccess(identifier, this.cgen.builder.createLoad(pi));
    this.cgen.builder.createStore(v, pv);

    this.cgen.withContinueBreakBlock(loopIncr, loopQuit, () => {
      this.cgen.genStatement(node.statement);
    });
    this.cgen.builder.createBr(loopIncr);

    this.cgen.builder.setInsertionPoint(loopIncr);
    const n = this.cgen.builder.createAdd(
      this.cgen.builder.createLoad(pi),
      llvm.ConstantInt.get(this.cgen.context, 1, 64)
    );
    this.cgen.builder.createStore(n, pi);
    const ptr = this.cgen.builder.createInBoundsGEP(identifier, [llvm.ConstantInt.get(this.cgen.context, 0, 64), n]);
    this.cgen.builder.createStore(this.cgen.builder.createLoad(ptr), pv);
    this.cgen.builder.createBr(loopCond);

    this.cgen.builder.setInsertionPoint(loopQuit);
  }
}
