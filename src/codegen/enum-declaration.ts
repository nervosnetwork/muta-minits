import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import { StructMetaType } from '../types';
import LLVMCodeGen from './';

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
    const last: { lastType: llvm.Type; text: string } = {
      lastType: llvm.Type.getInt64Ty(this.cgen.context),
      text: '0'
    };

    for (const [index, m] of members.entries()) {
      const fieldName = `${namespace}.${m.name.getText()}`;

      const value = (() => {
        // enum T {a = 100, b == 101}
        if (m.initializer) {
          last.text = m.initializer.getText();
          const genValue = this.cgen.genExpression(m.initializer);

          if (genValue.type.typeID !== last.lastType.typeID) {
            throw new Error('Enum data types must be consistent.');
          }
          return genValue;

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

      // If it is a global pointer, create a global variable and register it in the symbol table.
      if (this.cgen.symtab.isGlobal() && value.type.isPointerTy()) {
        const globalValue = new llvm.GlobalVariable(
          this.cgen.module,
          value.type,
          true,
          llvm.LinkageTypes.ExternalLinkage,
          value as llvm.Constant,
          fieldName
        );

        this.cgen.symtab.set(fieldName, { value: globalValue });

        // If it is a pointer, create a local variable and register it in the symbol table.
      } else if (value.type.isPointerTy()) {
        const alloc = this.cgen.builder.createAlloca(value.type);
        this.cgen.builder.createStore(value, alloc, false);

        this.cgen.symtab.set(fieldName, { value: alloc });

        // If it is an integer, the value is used directly and no variables are created.
      } else {
        this.cgen.symtab.set(fieldName, { value });
      }
    }
    return last.lastType;
  }
}
