import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';
import { StructMetaType } from '../types';

const debug = Debug('minits:codegen:struct');

debug('codegen-enum');

export default class CodeGenStruct {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genEnumDeclaration(node: ts.EnumDeclaration): void {
    const enumName = node.name.text;

    const enumMemberType = this.genElements(enumName, node.members);
    const enumType = llvm.StructType.create(this.cgen.context, enumName);
    enumType.setBody([enumMemberType]);

    this.cgen.structTab.set(enumName, { metaType: StructMetaType.Enum, fields: new Map() });
  }

  public genEnumElementAccess(node: ts.PropertyAccessExpression): llvm.Value {
    return this.cgen.symtab.get(node.getText()).value;
  }

  private genElements(namespace: string, members: ts.NodeArray<ts.EnumMember>): llvm.Type {
    let last: { lastType: llvm.Type; text: string } = {
      lastType: llvm.Type.getInt64Ty(this.cgen.context),
      text: '0'
    };

    for (const [index, m] of members.entries()) {
      const fieldName = `${namespace}.${m.name.getText()}`;

      const value = (() => {
        // enum T {a = 100, b == 101}
        if (m.initializer) {
          last.text = m.initializer.getText();
          const value = this.cgen.genExpression(m.initializer);

          if (value.type.typeID !== last.lastType.typeID) {
            throw new Error('Enum data types must be consistent.');
          }
          return value;

          // enum T { a }
        } else if (index === 0) {
          return llvm.ConstantInt.get(this.cgen.context, 0, 64, true);

          // enum T { a = 100, b }
        } else if (index > 0 && last) {
          const num = parseInt(last.text, 10) + 1;
          last.text = num + '';

          return llvm.ConstantInt.get(this.cgen.context, num, 64, true);
        } else {
          throw new Error('Enum member must have initializer.');
        }
      })();

      this.cgen.symtab.set(fieldName, { value });
      if (this.cgen.symtab.isGlobal()) {
        new llvm.GlobalVariable(
          this.cgen.module,
          value.type,
          true,
          llvm.LinkageTypes.ExternalLinkage,
          value as llvm.Constant,
          fieldName
        );
      } else {
        const alloc = this.cgen.builder.createAlloca(value.type);
        this.cgen.builder.createStore(value, alloc, false);
      }
    }
    return last.lastType;
  }
}
