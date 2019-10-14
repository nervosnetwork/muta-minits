import llvm from 'llvm-node';
import ts from 'typescript';

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
        if (this.cgen.currentFunction) {
          return this.genVariableDeclarationLocale(node);
        } else {
          return this.genVariableDeclarationGlobal(node);
        }
      });
    });
  }

  public genVariableDeclarationLocale(node: ts.VariableDeclaration): llvm.Value {
    const name = node.name.getText();
    const initializer = this.cgen.genExpression(node.initializer!);
    const type = initializer.type;

    const alloca = this.cgen.builder.createAlloca(type, undefined, name);
    this.cgen.builder.createStore(initializer, alloca);
    this.cgen.symtab.set(name, new symtab.LLVMValue(alloca, 1));
    return alloca;
  }

  public genVariableDeclarationGlobal(node: ts.VariableDeclaration): llvm.Value {
    switch (node.initializer!.kind) {
      case ts.SyntaxKind.NumericLiteral:
        return this.genNumericGlobal(node.initializer! as ts.NumericLiteral);
      case ts.SyntaxKind.StringLiteral:
        return this.genStringLiteralGlobal(node.initializer! as ts.StringLiteral);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.genArrayLiteralGlobal(node.initializer! as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.genObjectLiteralGlobal(node.initializer! as ts.ObjectLiteralExpression);
      default:
        throw new Error(`Unsupported grammar: ${node.getText()}`);
    }
  }

  private genNumericGlobal(node: ts.NumericLiteral): llvm.GlobalVariable {
    const a = this.cgen.cgNumeric.genNumericGlobal(node);
    const argName = this.cgen.symtab.name() + this.cgen.readName();
    const r = new llvm.GlobalVariable(this.cgen.module, a.type, false, llvm.LinkageTypes.ExternalLinkage, a, argName);
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(r, 1));
    return r;
  }

  private genStringLiteralGlobal(node: ts.StringLiteral): llvm.GlobalVariable {
    const a = this.cgen.cgString.genStringLiteralGlobal(node) as llvm.Constant;
    const argName = this.cgen.symtab.name() + this.cgen.readName();
    const v = new llvm.GlobalVariable(this.cgen.module, a.type, false, llvm.LinkageTypes.ExternalLinkage, a, argName);
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(v, 1));
    return v;
  }

  private genArrayLiteralGlobal(node: ts.ArrayLiteralExpression): llvm.Value {
    const r = this.cgen.cgArray.genArrayLiteralGlobal(node);
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(r, 0));
    return r;
  }

  private genObjectLiteralGlobal(node: ts.ObjectLiteralExpression): llvm.Value {
    const r = this.cgen.cgObject.genObjectLiteralExpression(node);
    this.cgen.symtab.set(this.cgen.readName(), new symtab.LLVMValue(r, 0));
    return r;
  }
}
