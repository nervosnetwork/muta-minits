import llvm from 'llvm-node';
import ts from 'typescript';

import { buildStructMaps, findRealType } from '../common';
import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genVariableDeclaration(node: ts.VariableDeclaration): llvm.Value {
    return this.cgen.withName(node.name.getText(), () => {
      return this.cgen.withType(node.type, () => {
        if (this.cgen.currentFunction === undefined) {
          return this.genVariableDeclarationGlobal(node);
        } else {
          return this.genVariableDeclarationLocale(node);
        }
      });
    });
  }

  public genVariableDeclarationLocale(node: ts.VariableDeclaration): llvm.Value {
    const name = node.name.getText();
    const initializer = this.cgen.genExpression(node.initializer!);
    const type = initializer.type;

    // ArrayLiteral
    if (type.isPointerTy() && (type as llvm.PointerType).elementType.isArrayTy()) {
      this.cgen.symtab.set(name, { inner: initializer, deref: 0 });
      return initializer;
    }

    const realType = findRealType(type);
    if (realType.isStructTy()) {
      const fields = buildStructMaps(realType, node.initializer! as ts.ObjectLiteralExpression);
      this.cgen.symtab.set(name, { inner: initializer, deref: 0, fields });
      return initializer;
    }

    // Others
    const alloca = this.cgen.builder.createAlloca(type, undefined, name);
    this.cgen.builder.createStore(initializer, alloca);
    this.cgen.symtab.set(name, { inner: alloca, deref: 1 });
    return alloca;
  }

  public genVariableDeclarationGlobal(node: ts.VariableDeclaration): llvm.Value {
    switch (node.initializer!.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genVariableDeclarationGlobalNumeric(node.initializer! as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.genVariableDeclarationGlobalStringLiteral(node.initializer! as ts.StringLiteral);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genVariableDeclarationGlobalArrayLiteral(node.initializer! as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.cgen.genObjectLiteralExpression(node.initializer! as ts.ObjectLiteralExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.cgen.genBinaryExpression(node.initializer! as ts.BinaryExpression);
      default:
        throw new Error(`Unsupported type ${node.initializer!.kind}`);
    }
  }

  public genVariableDeclarationGlobalNumeric(node: ts.NumericLiteral): llvm.GlobalVariable {
    const r = this.cgen.cgNumeric.genNumericGlobal(node);
    this.cgen.symtab.set(this.cgen.readName(), { inner: r, deref: 1 });
    return r;
  }

  public genVariableDeclarationGlobalStringLiteral(node: ts.StringLiteral): llvm.GlobalVariable {
    const v = this.cgen.cgString.genStringLiteralGlobal(node);
    this.cgen.symtab.set(this.cgen.readName(), { inner: v, deref: 1 });
    return v;
  }

  public genVariableDeclarationGlobalArrayLiteral(node: ts.ArrayLiteralExpression): llvm.GlobalVariable {
    const r = this.cgen.cgArray.genArrayLiteralGlobal(node);
    this.cgen.symtab.set(this.cgen.readName(), { inner: r, deref: 0 });
    return r;
  }
}
