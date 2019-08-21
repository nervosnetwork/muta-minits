import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genVariableDeclaration(node: ts.VariableDeclaration): llvm.Value {
    if (this.cgen.symtab.depths() === 0) {
      return this.genVariableDeclarationGlobal(node);
    } else {
      return this.genVariableDeclarationLocale(node);
    }
  }

  public genVariableDeclarationLocale(node: ts.VariableDeclaration): llvm.Value {
    const name = node.name.getText();
    this.cgen.currentType = node.type;
    const initializer = this.cgen.genExpression(node.initializer!);
    const type = initializer.type;

    if (type.isPointerTy()) {
      const real = type as llvm.PointerType;
      if (real.elementType.isArrayTy()) {
        this.cgen.symtab.set(name, initializer);
        return initializer;
      }
      throw new Error('Unsupported pointer type');
    } else {
      const alloca = this.cgen.builder.createAlloca(type, undefined, name);
      this.cgen.builder.createStore(initializer, alloca);
      this.cgen.symtab.set(name, alloca);
      return alloca;
    }
  }

  public genVariableDeclarationGlobal(node: ts.VariableDeclaration): llvm.Value {
    const name = node.name.getText();
    this.cgen.currentType = node.type;
    switch (node.initializer!.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genVariableDeclarationGlobalNumeric(node.initializer! as ts.NumericLiteral, name);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genVariableDeclarationGlobalArrayLiteral(node.initializer! as ts.ArrayLiteralExpression, name);
      default:
        throw new Error('Unsupported type');
    }
  }

  public genVariableDeclarationGlobalNumeric(node: ts.NumericLiteral, name: string): llvm.GlobalVariable {
    const initializer = this.cgen.genNumeric(node);
    const type = initializer.type;
    const r = new llvm.GlobalVariable(
      this.cgen.module,
      type,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      initializer,
      name
    );
    this.cgen.symtab.set(name, r);
    return r;
  }

  public genVariableDeclarationGlobalArrayLiteral(node: ts.ArrayLiteralExpression, name: string): llvm.GlobalVariable {
    const arrayType = this.cgen.cgArray.genArrayType(node);
    const arrayData = llvm.ConstantArray.get(
      arrayType,
      node.elements.map(item => {
        return this.cgen.genExpression(item) as llvm.Constant;
      })
    );
    const r = new llvm.GlobalVariable(
      this.cgen.module,
      arrayType,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      arrayData,
      name
    );
    this.cgen.symtab.set(name, r);
    return r;
  }
}
