import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

const debug = Debug('minits:codegen:enum');

debug('codegen-enum');

export default class CodeGenStruct {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genEnumDeclaration(node: ts.EnumDeclaration): void {
    if (node.members.length === 0) {
      return;
    }
    this.cgen.symtab.with(node.name.text, () => {
      this.genElements(node.members);
    });
  }

  private genElements(members: ts.NodeArray<ts.EnumMember>): void {
    // String
    if (members[0].initializer && members[0].initializer.kind === ts.SyntaxKind.StringLiteral) {
      for (const [, m] of members.entries()) {
        const fieldName = m.name.getText();
        const value = this.cgen.cgString.genStringLiteral(m.initializer as ts.StringLiteral);
        this.cgen.symtab.set(fieldName, { inner: value, deref: 0 });
      }
      return;
    }
    // Number
    let currentNum = 0;
    for (const [index, m] of members.entries()) {
      const fieldName = m.name.getText();
      const value = (() => {
        if (m.initializer) {
          const v = this.cgen.cgNumeric.genNumeric(m.initializer as ts.NumericLiteral);
          currentNum = v.value;
          return v;
        } else if (index === 0) {
          return llvm.ConstantInt.get(this.cgen.context, 0, 64, true);
        } else {
          currentNum += 1;
          return llvm.ConstantInt.get(this.cgen.context, currentNum, 64, true);
        }
      })();
      this.cgen.symtab.set(fieldName, { inner: value, deref: 0 });
    }
    return;
  }
}
