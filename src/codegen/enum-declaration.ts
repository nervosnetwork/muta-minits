import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenStruct {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genEnumDeclaration(node: ts.EnumDeclaration): void {
    this.cgen.symtab.with(node.name.text, () => {
      node.members.forEach(item => {
        const name = item.name.getText();
        const v = this.cgen.checker.getConstantValue(item);
        switch (typeof v) {
          case 'string':
            this.cgen.symtab.set(
              name,
              new symtab.LLVMValue(this.cgen.cgString.genStringLiteral(item.initializer! as ts.StringLiteral), 0)
            );
            break;
          case 'number':
            this.cgen.symtab.set(name, new symtab.LLVMValue(llvm.ConstantInt.get(this.cgen.context, v, 64), 0));
            break;
        }
      });
    });
  }
}
