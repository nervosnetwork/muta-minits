import llvm from 'llvm-node';
import ts from 'typescript';

import * as common from '../common';
import * as symtab from '../symtab';
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
      this.cgen.symtab.set(name, new symtab.LLVMValue(initializer, 0));
      return initializer;
    }

    // ObjectLiteral
    const realType = common.findRealType(type);
    if (realType.isStructTy()) {
      this.cgen.symtab.set(name, new symtab.LLVMValue(initializer, 0));
      return initializer;
    }

    // Others
    const alloca = this.cgen.builder.createAlloca(type, undefined, name);
    this.cgen.builder.createStore(initializer, alloca);
    this.cgen.symtab.set(name, new symtab.LLVMValue(alloca, 1));
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
    const a = this.cgen.cgNumeric.genNumericGlobal(node);
    const r = new llvm.GlobalVariable(
      this.cgen.module,
      a.type,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      a,
      this.cgen.symtab.name() + this.cgen.readName()
    );

    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(r, 1));
    return r;
  }

  public genVariableDeclarationGlobalStringLiteral(node: ts.StringLiteral): llvm.GlobalVariable {
    const a = this.cgen.cgString.genStringLiteralGlobal(node);
    const v = new llvm.GlobalVariable(
      this.cgen.module,
      a.type,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      a as llvm.Constant,
      this.cgen.symtab.name() + this.cgen.readName()
    );
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(v, 1));
    return v;
  }

  public genVariableDeclarationGlobalArrayLiteral(node: ts.ArrayLiteralExpression): llvm.GlobalVariable {
    const r = this.cgen.cgArray.genArrayLiteralGlobal(node);
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(r, 0));
    return r;
  }
}
