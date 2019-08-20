import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenForOf {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genForOfStatement(node: ts.ForOfStatement): void {
    const i = (() => {
      const name = 'loop.i';
      const initializer = llvm.ConstantInt.get(this.cgen.context, 0, 64);
      const type = initializer.type;
      const alloca = this.cgen.builder.createAlloca(type, undefined, name);
      this.cgen.builder.createStore(initializer, alloca);
      this.cgen.symtab.set(name, alloca);
      return alloca;
    })();
    const a = this.cgen.genExpression(node.expression) as llvm.AllocaInst;
    const v = (() => {
      const type = (a.type.elementType as llvm.ArrayType).elementType;
      const name = (node.initializer! as ts.VariableDeclarationList).declarations!.map(
        item => item.getText()
      )[0];
      const alloca = this.cgen.builder.createAlloca(type, undefined, name);
      this.cgen.symtab.set(name, alloca);
      return alloca;
    })();
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
    const l = llvm.ConstantInt.get(
      this.cgen.context,
      (a.type.elementType as llvm.ArrayType).numElements,
      64
    );
    const loopCond1 = this.cgen.builder.createICmpSLT(
      this.cgen.builder.createLoad(i),
      l
    );
    this.cgen.builder.createCondBr(loopCond1, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopBody);
    const p = this.cgen.builder.createInBoundsGEP(a, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      this.cgen.builder.createLoad(i)
    ]);
    this.cgen.builder.createStore(this.cgen.builder.createLoad(p), v);
    this.cgen.genStatement(node.statement);

    // Loop End
    const n = this.cgen.builder.createAdd(
      this.cgen.builder.createLoad(i),
      llvm.ConstantInt.get(this.cgen.context, 1, 64)
    );
    this.cgen.builder.createStore(n, i);
    const ptr = this.cgen.builder.createInBoundsGEP(a, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      n
    ]);
    this.cgen.builder.createStore(this.cgen.builder.createLoad(ptr), v);
    const loopCond2 = this.cgen.builder.createICmpSLT(
      this.cgen.builder.createLoad(i),
      l
    );
    this.cgen.builder.createCondBr(loopCond2, loopBody, loopQuit);
    this.cgen.builder.setInsertionPoint(loopQuit);
  }
}
