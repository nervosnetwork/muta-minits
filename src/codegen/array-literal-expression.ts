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
        return this.cgen.genType((this.cgen.currentType! as ts.ArrayTypeNode).elementType);
      }
      return this.cgen.genExpression(node.elements[0]).type;
    })();
    return llvm.ArrayType.get(elementType, length);
  }

  public genArrayInitializer(node: ts.ArrayLiteralExpression): llvm.Value[] {
    return node.elements.map(item => {
      return this.cgen.withName(undefined, () => {
        return this.cgen.genExpression(item);
      });
    });
  }

  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.Value {
    if (this.cgen.currentFunction) {
      return this.genArrayLiteralLocale(node);
    }
    return this.genArrayLiteralGlobal(node);
  }

  // [0] https://stackoverflow.com/questions/38548680/confused-about-llvm-arrays
  // [1] https://stackoverflow.com/questions/33003928/allow-llvm-generate-code-to-access-a-global-array
  public genArrayLiteralLocale(node: ts.ArrayLiteralExpression): llvm.Value {
    const arrayType = this.genArrayType(node);
    const arrayPtr = this.cgen.builder.createAlloca(arrayType);
    this.genArrayInitializer(node).forEach((item, i) => {
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
    const arrayType = this.cgen.cgArray.genArrayType(node);
    const arrayData = this.cgen.withName(undefined, () => {
      return llvm.ConstantArray.get(
        arrayType,
        node.elements.map(item => {
          return this.cgen.genExpression(item) as llvm.Constant;
        })
      );
    });
    const r = new llvm.GlobalVariable(
      this.cgen.module,
      arrayType,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      arrayData,
      this.cgen.symtab.name() + this.cgen.readName()
    );
    return this.cgen.builder.createBitCast(r, arrayType.elementType.getPointerTo());
  }

  public getElementAccessPtr(identifier: llvm.Value, i: llvm.Value): llvm.Value {
    return this.cgen.builder.createInBoundsGEP(identifier, [i]);
  }

  public genElementAccessPtr(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    return this.getElementAccessPtr(identifier, argumentExpression);
  }

  public getElementAccess(identifier: llvm.Value, i: llvm.Value): llvm.Value {
    const ptr = this.getElementAccessPtr(identifier, i);
    return this.cgen.builder.createLoad(ptr);
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    return this.getElementAccess(identifier, argumentExpression);
  }
}
