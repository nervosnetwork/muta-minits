// [0] https://stackoverflow.com/questions/1061753/how-can-i-implement-a-string-data-type-in-llvm
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenString {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public isStringLiteral(expr: ts.Expression): boolean {
    if (ts.isStringLiteral(expr)) {
      return true;
    }
    const type = this.cgen.checker.getTypeAtLocation(expr);
    if (type.isStringLiteral()) {
      return true;
    }
    if (type.flags === ts.TypeFlags.String) {
      return true;
    }
    return false;
  }

  public genStringLiteral(node: ts.StringLiteral): llvm.Value {
    if (this.cgen.currentFunction) {
      return this.genStringLiteralLocale(node);
    } else {
      return this.genStringLiteralGlobal(node);
    }
  }

  public genStringLiteralLocale(node: ts.StringLiteral): llvm.Value {
    return this.cgen.builder.createGlobalStringPtr(node.text);
  }

  // [0] How to create global string array? http://lists.llvm.org/pipermail/llvm-dev/2010-June/032072.html
  public genStringLiteralGlobal(node: ts.StringLiteral): llvm.Value {
    const v = llvm.ConstantDataArray.getString(this.cgen.context, node.text);
    const r = new llvm.GlobalVariable(this.cgen.module, v.type, false, llvm.LinkageTypes.ExternalLinkage, v);
    return this.cgen.builder.createBitCast(r, llvm.Type.getInt8PtrTy(this.cgen.context));
  }

  public getElementAccess(identifier: llvm.Value, i: llvm.Value): llvm.Value {
    const ptr = this.cgen.builder.createInBoundsGEP(identifier, [i]);
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

  public genElementAccessExpression(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    return this.getElementAccess(identifier, argumentExpression);
  }

  public eq(lhs: llvm.Value, rhs: llvm.Value): llvm.Value {
    const r = this.cgen.stdlib.strcmp([lhs, rhs]);
    return this.cgen.builder.createICmpEQ(r, llvm.ConstantInt.get(this.cgen.context, 0, 64));
  }

  public ne(lhs: llvm.Value, rhs: llvm.Value): llvm.Value {
    const r = this.cgen.stdlib.strcmp([lhs, rhs]);
    return this.cgen.builder.createICmpNE(r, llvm.ConstantInt.get(this.cgen.context, 0, 64));
  }

  public concat(lhs: llvm.Value, rhs: llvm.Value): llvm.Value {
    const lhsLength = this.cgen.stdlib.strlen([lhs]);
    const rhsLength = this.cgen.stdlib.strlen([rhs]);
    const length = this.cgen.builder.createAdd(
      this.cgen.builder.createAdd(lhsLength, rhsLength),
      llvm.ConstantInt.get(this.cgen.context, 1, 64)
    );
    const ptr = this.cgen.builder.createAlloca(llvm.Type.getInt8Ty(this.cgen.context), length);
    this.cgen.stdlib.strcpy([ptr, lhs]);
    this.cgen.stdlib.strcat([ptr, rhs]);
    return ptr;
  }

  public getPropertyAccessExpression(s: llvm.Value, property: string): llvm.Value {
    switch (property) {
      case 'length':
        return this.cgen.stdlib.strlen([s]);
      default:
        throw new Error(`Object doesn't support property or method '${property}'`);
    }
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): llvm.Value {
    const s = this.cgen.genExpression(node.expression);
    const property = node.name.getText();
    return this.getPropertyAccessExpression(s, property);
  }
}
