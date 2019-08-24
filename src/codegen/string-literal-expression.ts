// [0] https://stackoverflow.com/questions/1061753/how-can-i-implement-a-string-data-type-in-llvm
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenString {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genStringLiteral(node: ts.StringLiteral): llvm.Value {
    return this.cgen.builder.createGlobalStringPtr(node.text, 'string');
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    const ptr = this.cgen.builder.createInBoundsGEP(identifier, [argumentExpression]);
    const val = this.cgen.builder.createLoad(ptr);

    const arrayType = llvm.ArrayType.get(llvm.Type.getInt8Ty(this.cgen.context), 2);
    const arraySize = llvm.ConstantInt.get(this.cgen.context, 2, 64);
    const arrayPtr = this.cgen.builder.createAlloca(arrayType, arraySize);

    const ptr0 = this.cgen.builder.createInBoundsGEP(arrayPtr, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      llvm.ConstantInt.get(this.cgen.context, 0, 64)
    ]);
    const ptr1 = this.cgen.builder.createInBoundsGEP(arrayPtr, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      llvm.ConstantInt.get(this.cgen.context, 1, 64)
    ]);
    this.cgen.builder.createStore(val, ptr0);
    this.cgen.builder.createStore(llvm.ConstantInt.get(this.cgen.context, 0, 8), ptr1);
    return this.cgen.builder.createBitCast(arrayPtr, llvm.Type.getInt8PtrTy(this.cgen.context));
  }
}
