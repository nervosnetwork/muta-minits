import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  // Function genArrayType returns the real array type by it's initialization.
  //
  // Examples:
  //   const a = [1, 2, 3, 4] => ArrayType(elemType=i64, size=4)
  //   const b = [a, b, 3, 4] => ArrayType(elemType=a.type, size=4)
  //   const c: number[] = [] => ArrayType(elemType=i64, size=0)
  public genArrayType(node: ts.ArrayLiteralExpression): llvm.ArrayType {
    const size = node.elements.length;
    const elemType = (() => {
      if (this.cgen.currentType) {
        return this.cgen.genType((this.cgen.currentType! as ts.ArrayTypeNode).elementType);
      } else {
        return this.cgen.genExpression(node.elements[0]).type;
      }
    })();
    return llvm.ArrayType.get(elemType, size);
  }

  // [0] https://stackoverflow.com/questions/38548680/confused-about-llvm-arrays
  // [1] https://stackoverflow.com/questions/33003928/allow-llvm-generate-code-to-access-a-global-array
  public genArrayLiteralLocale(node: ts.ArrayLiteralExpression): llvm.Value {
    const arrayType = this.genArrayType(node);
    const arrayPtr = this.cgen.builder.createAlloca(arrayType);
    node.elements
      .map(item => {
        return this.cgen.genExpression(item);
      })
      .forEach((item, i) => {
        const ptr = this.cgen.builder.createInBoundsGEP(arrayPtr, [
          llvm.ConstantInt.get(this.cgen.context, 0, 64),
          llvm.ConstantInt.get(this.cgen.context, i, 64)
        ]);
        this.cgen.builder.createStore(item, ptr);
      });
    return this.cgen.builder.createInBoundsGEP(arrayPtr, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      llvm.ConstantInt.get(this.cgen.context, 0, 64)
    ]);
  }

  public genArrayLiteralGlobal(node: ts.ArrayLiteralExpression): llvm.Value {
    const arrayType = this.genArrayType(node);
    const arrayData = llvm.ConstantArray.get(
      arrayType,
      node.elements.map(item => {
        return this.cgen.genExpression(item) as llvm.Constant;
      })
    );
    const r = new llvm.GlobalVariable(this.cgen.module, arrayType, false, llvm.LinkageTypes.ExternalLinkage, arrayData);
    return this.cgen.builder.createBitCast(r, arrayType.elementType.getPointerTo());
  }

  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.Value {
    if (this.cgen.currentFunction) {
      return this.genArrayLiteralLocale(node);
    } else {
      return this.genArrayLiteralGlobal(node);
    }
  }

  public getElementAccessPtr(identifier: llvm.Value, i: llvm.Value): llvm.Value {
    return this.cgen.builder.createInBoundsGEP(identifier, [i]);
  }

  public getElementAccess(identifier: llvm.Value, i: llvm.Value): llvm.Value {
    const ptr = this.getElementAccessPtr(identifier, i);
    return this.cgen.builder.createLoad(ptr);
  }

  public genElementAccessExpressionPtr(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    return this.getElementAccessPtr(identifier, argumentExpression);
  }

  public genElementAccessExpression(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    return this.getElementAccess(identifier, argumentExpression);
  }
}
