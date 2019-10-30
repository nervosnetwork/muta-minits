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
            const a = new symtab.Leaf(this.cgen.genStringLiteral(item.initializer! as ts.StringLiteral), 0);
            this.cgen.symtab.set(name, a);
            break;
          case 'number':
            const b = new symtab.Leaf(llvm.ConstantInt.get(this.cgen.context, v, 64), 0);
            this.cgen.symtab.set(name, b);
            break;
        }
      });
    });
  }
}
