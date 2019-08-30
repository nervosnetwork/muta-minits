import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import * as common from '../common';
import { StructMetaType } from '../types';
import LLVMCodeGen from './';

const debug = Debug('minits:codegen:object');

debug('codegen-object');

export default class GenObject {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genObjectLiteralExpression(node: ts.ObjectLiteralExpression): llvm.Value {
    const varName = (node.parent as ts.VariableDeclaration).name.getText();
    const values: llvm.Value[] = [];
    const types = [];

    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p)) {
        const value = this.genPropertyAssignment(p);
        values.push(value);
        types.push(value.type);
      } else {
        throw new Error('Unsupported assignments');
      }
    }

    const typeHash = common.genTypesHash(types);

    if (!this.cgen.structTab.get(typeHash)) {
      const structType = llvm.StructType.create(this.cgen.context, typeHash);
      structType.setBody(types, false);

      this.cgen.structTab.set(typeHash, { metaType: StructMetaType.Class, typeHash, struct: structType });
    }

    const structMeta = this.cgen.structTab.get(typeHash)!;

    return this.initObjectInst(varName, structMeta.struct, values as llvm.Constant[]);
  }

  public genObjectElementAccess(node: ts.PropertyAccessExpression): llvm.Value {
    const ptr = this.genObjectElementAccessPtr(node);
    return this.cgen.builder.createLoad(ptr);
  }

  public genObjectElementAccessPtr(node: ts.PropertyAccessExpression): llvm.Value {
    const { value, fields } = this.cgen.symtab.get(node.expression.getText());
    const field = node.name.getText();
    const index = fields!.get(field)!;

    // const ptr = this.cgen.builder.createLoad(value);
    return this.cgen.builder.createInBoundsGEP(value, [
      llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
      llvm.ConstantInt.get(this.cgen.context, index, 32, true)
    ]);
  }

  public genObjectLiteralType(type: ts.TypeLiteralNode): llvm.Type {
    const types: llvm.Type[] = [];

    type.members.forEach(m => types.push(this.genPropertySignature(m as ts.PropertySignature)));
    const typeHash = common.genTypesHash(types);

    if (!this.cgen.structTab.get(typeHash)) {
      const structType = llvm.StructType.create(this.cgen.context, typeHash);
      structType.setBody(types, false);

      this.cgen.structTab.set(typeHash, { metaType: StructMetaType.Class, typeHash, struct: structType });
    }

    return this.cgen.structTab.get(typeHash)!.struct.getPointerTo();
  }

  public genPropertySignature(type: ts.PropertySignature): llvm.Type {
    return this.cgen.genType(type.type!);
  }

  public initObjectInst(varName: string, type: llvm.Type, values: llvm.Constant[]): llvm.Value {
    const structType = common.findRealType(type);
    if (!structType.isStructTy()) {
      throw new Error('The type must be a struct.');
    }

    // TODO: If values is empty, assign an initial value.
    if (this.cgen.symtab.isGlobal()) {
      return new llvm.GlobalVariable(
        this.cgen.module,
        structType,
        false,
        llvm.LinkageTypes.ExternalLinkage,
        llvm.ConstantStruct.get(structType, values as llvm.Constant[])
      );
    } else {
      const alloc = this.cgen.builder.createAlloca(structType, undefined, varName);
      this.cgen.builder.createStore(llvm.ConstantStruct.get(structType, values as llvm.Constant[]), alloc);
      return alloc;
    }
  }

  private genPropertyAssignment(node: ts.PropertyAssignment): llvm.Value {
    return this.cgen.genExpression(node.initializer);
  }
}
