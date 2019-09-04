import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genArrayType(node: ts.ArrayLiteralExpression): llvm.ArrayType {
    const length = node.elements.length;
    const elementType = (() => {
      // Typing Hints
      if (length === 0) {
        return this.cgen.genType((this.cgen.currentType! as ts.ArrayTypeNode).elementType);
      }
      // Numeric
      if (node.elements[0].kind === ts.SyntaxKind.NumericLiteral) {
        return llvm.Type.getInt64Ty(this.cgen.context);
      }
      // String
      if (node.elements[0].kind === ts.SyntaxKind.StringLiteral) {
        return llvm.Type.getInt8PtrTy(this.cgen.context);
      }
      // Identifier
      if (node.elements[0].kind === ts.SyntaxKind.Identifier) {
        const symbol = this.cgen.symtab.get(node.elements[0].getText())! as symtab.LLVMValue;
        if (symbol.inner.type.isPointerTy()) {
          return (symbol.inner.type as llvm.PointerType).elementType;
        }

        return symbol.inner.type;
      }

      throw new Error('Unsupported element type');
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

  // [0] https://stackoverflow.com/questions/38548680/confused-about-llvm-arrays
  // [1] https://stackoverflow.com/questions/33003928/allow-llvm-generate-code-to-access-a-global-array
  public genArrayLiteral(node: ts.ArrayLiteralExpression): llvm.AllocaInst {
    const arrayType = this.genArrayType(node);
    const arrayPtr = this.cgen.builder.createAlloca(arrayType);
    this.genArrayInitializer(node).forEach((item, i) => {
      const ptr = this.cgen.builder.createInBoundsGEP(arrayPtr, [
        llvm.ConstantInt.get(this.cgen.context, 0, 64),
        llvm.ConstantInt.get(this.cgen.context, i, 64)
      ]);
      this.cgen.builder.createStore(item, ptr);
    });
    return arrayPtr;
  }

  public genArrayLiteralGlobal(node: ts.ArrayLiteralExpression): llvm.GlobalVariable {
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
    return r;
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const identifier = this.cgen.genExpression(node.expression);
    const argumentExpression = this.cgen.genExpression(node.argumentExpression);
    const ptr = (() => {
      if ((identifier.type as llvm.PointerType).elementType.isArrayTy()) {
        return this.cgen.builder.createInBoundsGEP(identifier, [
          llvm.ConstantInt.get(this.cgen.context, 0, 64),
          argumentExpression
        ]);
      } else {
        return this.cgen.builder.createInBoundsGEP(identifier, [argumentExpression]);
      }
    })();
    return this.cgen.builder.createLoad(ptr);
  }
}
