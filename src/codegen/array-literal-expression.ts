import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genArrayType(node: ts.ArrayLiteralExpression): llvm.ArrayType {
    const length = node.elements.length;
    const elementType = (() => {
      if (length === 0) {
        return this.cgen.genType(
          (this.cgen.currentType! as ts.ArrayTypeNode).elementType
        );
      } else {
        return this.cgen.genExpression(node.elements[0]).type;
      }
    })();
    return llvm.ArrayType.get(elementType, length);
  }

  public genArrayInitializer(node: ts.ArrayLiteralExpression): llvm.Value[] {
    return node.elements.map(item => this.cgen.genExpression(item));
  }

  // [0] https://stackoverflow.com/questions/38548680/confused-about-llvm-arrays
  // [1] https://stackoverflow.com/questions/33003928/allow-llvm-generate-code-to-access-a-global-array
  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.AllocaInst {
    const arrayType = this.genArrayType(node);
    const arraySize = llvm.ConstantInt.get(
      this.cgen.context,
      arrayType.numElements,
      64
    );
    const arrayPtr = this.cgen.builder.createAlloca(arrayType, arraySize);
    this.genArrayInitializer(node).forEach((item, i) => {
      const ptr = this.cgen.builder.createInBoundsGEP(arrayPtr, [
        llvm.ConstantInt.get(this.cgen.context, 0, 64),
        llvm.ConstantInt.get(this.cgen.context, i, 64)
      ]);
      this.cgen.builder.createStore(item, ptr);
    });
    return arrayPtr;
  }

  public genArrayElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genAutoDereference(
      this.cgen.genExpression(node.argumentExpression)
    );
    const ptr = this.cgen.builder.createInBoundsGEP(identifier, [
      llvm.ConstantInt.get(this.cgen.context, 0, 64),
      argumentExpression
    ]);
    return ptr;
  }
}
