import llvm from 'llvm-node';
import ts from 'typescript';

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
            this.cgen.symtab.set(name, {
              deref: 0,
              inner: this.cgen.cgString.genStringLiteral(item.initializer! as ts.StringLiteral)
            });
            break;
          case 'number':
            this.cgen.symtab.set(name, {
              deref: 0,
              inner: llvm.ConstantInt.get(this.cgen.context, v, 64)
            });
            break;
        }
      });
    });
  }
}
