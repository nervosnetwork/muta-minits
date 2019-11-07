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
    const memberTypeList = node.members
      .filter(ts.isPropertyDeclaration)
      .map(e => this.cgen.genType((e as ts.PropertyDeclaration).type!));
    const structType = llvm.StructType.create(this.cgen.context, name);
    structType.setBody(memberTypeList, false);
    return structType;
  }
}
