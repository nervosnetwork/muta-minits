import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

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

    const { types, initializers } = this.genElements(enumName, node.members);

    const enumType = llvm.StructType.create(
      this.cgen.context,
      `enum.${enumName}`
    );
    enumType.setBody(types);

    const enumInst = llvm.ConstantStruct.get(
      enumType,
      initializers as llvm.Constant[]
    );

    if (this.cgen.symtab.depths() === 0) {
      const globalStruct = new llvm.GlobalVariable(
        this.cgen.module,
        enumType,
        true,
        llvm.LinkageTypes.ExternalLinkage,
        enumInst,
        enumName
      );

      this.cgen.symtab.set(enumName, globalStruct);
    } else {
      const alloc = this.cgen.builder.createAlloca(enumType);
      this.cgen.builder.createStore(enumInst, alloc);
    }
  }

  public genEnumElementAccess(node: ts.PropertyAccessExpression): llvm.Value {
    const field = node.getText();
    debug(field);
    debug(this.cgen.symtab.get(field));
    return this.cgen.symtab.get(field)!;
  }

  private genElements(
    name: string,
    members: ts.NodeArray<ts.EnumMember>
  ): { types: llvm.Type[]; initializers: llvm.Value[] } {
    const types: llvm.Type[] = [];
    const initializers: llvm.Value[] = [];
    let last: { lastType: llvm.Type; text: string } = {
      lastType: llvm.Type.getInt64Ty(this.cgen.context),
      text: '0'
    };

    for (const [index, m] of members.entries()) {
      const fieldName = `${name}.${(m.name as ts.Identifier).text}`;

      const value = (() => {
        // enum T {a = 100, b == 101}
        if (m.initializer) {
          last.text = m.initializer.getText();
          return this.cgen.genExpression(m.initializer);

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

      last.lastType = value.type;
      types.push(value.type);
      initializers.push(value);

      this.cgen.symtab.set(fieldName, value);
    }

    return { types, initializers };
  }
}
