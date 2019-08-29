import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import { genTypesHash } from '../common';
import { StructMeta, StructMetaType } from '../types';
import LLVMCodeGen from './';

const debug = Debug('minits:codegen:object');

debug('codegen-object');

export default class GenObject {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genObjectLiteralExpression(node: ts.ObjectLiteralExpression): llvm.Value {
    const kinds = [];
    const values: llvm.Value[] = [];
    const types = [];

    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p)) {
        const init = p.initializer;

        kinds.push(init.kind);

        const value = this.genPropertyAssignment(p);
        values.push(value);
        types.push(value.type);
      } else {
        throw new Error('Unsupported assignments');
      }
    }

    const typeHash = genTypesHash(types);

    if (!this.cgen.structTab.get(typeHash)) {
      const structType = llvm.StructType.create(this.cgen.context, typeHash);
      structType.setBody(types, false);

      this.cgen.structTab.set(typeHash, { metaType: StructMetaType.Class, typeHash, struct: structType });
    }

    const structMeta = this.cgen.structTab.get(typeHash)!;

    return this.genObjectInst(structMeta.struct, values as llvm.Constant[]);
  }

  public genObjectElementAccess(node: ts.PropertyAccessExpression): llvm.Value {
    const { value, fields } = this.cgen.symtab.get(node.expression.getText());
    const field = node.name.getText();
    const index = fields!.get(field)!;

    const ptr = this.cgen.builder.createInBoundsGEP(value, [
      llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
      llvm.ConstantInt.get(this.cgen.context, index, 32, true)
    ]);
    return this.cgen.builder.createLoad(ptr);
  }

  private genObjectInst(struct: llvm.StructType, values: llvm.Constant[]): llvm.Value {
    if (this.cgen.symtab.isGlobal()) {
      return new llvm.GlobalVariable(
        this.cgen.module,
        struct,
        false,
        llvm.LinkageTypes.ExternalLinkage,
        llvm.ConstantStruct.get(struct, values as llvm.Constant[])
      );
    } else {
      const alloc = this.cgen.builder.createAlloca(struct);
      this.cgen.builder.createStore(llvm.ConstantStruct.get(struct, values as llvm.Constant[]), alloc);
      return alloc;
    }
  }

  private genPropertyAssignment(node: ts.PropertyAssignment): llvm.Value {
    return this.cgen.genExpression(node.initializer);
  }
}
