import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './codegen';

export function genForOfStatement(
  cgen: LLVMCodeGen,
  node: ts.ForOfStatement
): void {
  const i = (() => {
    const name = 'loop.i';
    const initializer = llvm.ConstantInt.get(cgen.context, 0, 64);
    const type = initializer.type;
    const alloca = cgen.builder.createAlloca(type, undefined, name);
    cgen.builder.createStore(initializer, alloca);
    cgen.symtab.set(name, alloca);
    return alloca;
  })();
  const a = cgen.genExpression(node.expression) as llvm.AllocaInst;
  const v = (() => {
    const type = (a.type.elementType as llvm.ArrayType).elementType;
    const name = (node.initializer! as ts.VariableDeclarationList).declarations!.map(
      item => item.getText()
    )[0];
    const alloca = cgen.builder.createAlloca(type, undefined, name);
    const p = cgen.builder.createInBoundsGEP(a, [
      llvm.ConstantInt.get(cgen.context, 0, 64),
      llvm.ConstantInt.get(cgen.context, 0, 64)
    ]);
    cgen.builder.createStore(cgen.builder.createLoad(p), alloca);
    cgen.symtab.set(name, alloca);
    return alloca;
  })();
  const loopBody = llvm.BasicBlock.create(
    cgen.context,
    'loop.body',
    cgen.currentFunction
  );
  const loopQuit = llvm.BasicBlock.create(
    cgen.context,
    'loop.quit',
    cgen.currentFunction
  );

  // Loop Header
  const l = llvm.ConstantInt.get(
    cgen.context,
    (a.type.elementType as llvm.ArrayType).numElements,
    64
  );
  const loopCond1 = cgen.builder.createICmpSLT(cgen.builder.createLoad(i), l);
  cgen.builder.createCondBr(loopCond1, loopBody, loopQuit);
  cgen.builder.setInsertionPoint(loopBody);
  cgen.genStatement(node.statement);

  // Loop End
  const n = cgen.builder.createAdd(
    cgen.builder.createLoad(i),
    llvm.ConstantInt.get(cgen.context, 1, 64)
  );
  cgen.builder.createStore(n, i);
  const ptr = cgen.builder.createInBoundsGEP(a, [
    llvm.ConstantInt.get(cgen.context, 0, 64),
    n
  ]);
  cgen.builder.createStore(cgen.builder.createLoad(ptr), v);
  const loopCond2 = cgen.builder.createICmpSLT(cgen.builder.createLoad(i), l);
  cgen.builder.createCondBr(loopCond2, loopBody, loopQuit);
  cgen.builder.setInsertionPoint(loopQuit);
}
