import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenClassDeclaration {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genClassDeclaration(node: ts.ClassDeclaration): llvm.StructType {
    const name = node.name!.getText();
    const show = this.cgen.symtab.name() + name;
    const properties: ts.PropertyDeclaration[] = [];
    for (const e of node.members) {
      if (ts.isPropertyDeclaration(e)) {
        properties.push(e);
      }
    }
    const memberTypeList = properties.map(e => this.cgen.genType(e.type!));
    const structType = llvm.StructType.create(this.cgen.context, show);
    structType.setBody(memberTypeList, false);
    return structType;
  }

  public genPropertyAccessExpressionPtr(node: ts.PropertyAccessExpression): llvm.Value {
    const type = this.cgen.checker.getTypeAtLocation(node.expression);
    const properties = this.cgen.checker.getPropertiesOfType(type);
    const index = properties.findIndex(property => property.name === node.name.getText());
    const value = this.cgen.genExpression(node.expression);

    return this.cgen.builder.createInBoundsGEP(value, [
      llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
      llvm.ConstantInt.get(this.cgen.context, index, 32, true)
    ]);
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): llvm.Value {
    const ptr = this.genPropertyAccessExpressionPtr(node);
    return this.cgen.builder.createLoad(ptr);
  }
}
