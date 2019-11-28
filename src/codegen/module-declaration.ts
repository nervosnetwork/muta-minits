import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenModule {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genModuleDeclaration(node: ts.ModuleDeclaration): void {
    this.cgen.symtab.with(node.name.text, () => {
      (node.body! as ts.ModuleBlock).statements.forEach(e => {
        this.cgen.genStatement(e);
      });
    });
  }
}
