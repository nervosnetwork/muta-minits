import crypto from 'crypto';
import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

const debug = Debug('minits:codegen:object');

debug('codegen-object');

export default class GenObject {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genObjectLiteralExpression(node: ts.ObjectLiteralExpression): llvm.Value {
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

    const typeHash = genTypesHash(types);
    const name = 'TypeLiteral-' + typeHash;

    if (!this.cgen.module.getTypeByName(name)) {
      const structType = llvm.StructType.create(this.cgen.context, name);
      structType.setBody(types, false);
    }

    return this.initObjectInst(
      this.cgen.currentName!,
      this.cgen.module.getTypeByName(name)!,
      values as llvm.Constant[]
    );
  }

  public genObjectElementAccess(node: ts.PropertyAccessExpression): llvm.Value {
    const ptr = this.genObjectElementAccessPtr(node);
    return this.cgen.builder.createLoad(ptr);
  }

  public genObjectElementAccessPtr(node: ts.PropertyAccessExpression): llvm.Value {
    const type = this.cgen.checker.getTypeAtLocation(node.expression);
    const properties = this.cgen.checker.getPropertiesOfType(type);
    const index = properties.findIndex(property => property.name === node.name.getText());
    const value = this.cgen.symtab.get(node.expression.getText()) as symtab.LLVMValue;

    return this.cgen.builder.createInBoundsGEP(value.inner, [
      llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
      llvm.ConstantInt.get(this.cgen.context, index, 32, true)
    ]);
  }

  public genObjectLiteralType(type: ts.TypeLiteralNode): llvm.Type {
    const types: llvm.Type[] = [];

    type.members.forEach(m => types.push(this.cgen.genType((m as ts.PropertySignature).type!)));
    const typeHash = genTypesHash(types);
    const name = 'TypeLiteral-' + typeHash;

    if (!this.cgen.module.getTypeByName(name)) {
      const structType = llvm.StructType.create(this.cgen.context, name);
      structType.setBody(types, false);
    }

    return this.cgen.module.getTypeByName(name)!.getPointerTo();
  }

  public genPropertySignature(type: ts.PropertySignature): llvm.Type {
    return this.cgen.genType(type.type!);
  }

  public initObjectInst(varName: string, type: llvm.StructType, values: llvm.Constant[]): llvm.Value {
    const structType = type;
    // TODO: If values is empty, assign an initial value.
    if (this.cgen.currentFunction === undefined) {
      return new llvm.GlobalVariable(
        this.cgen.module,
        structType,
        false,
        llvm.LinkageTypes.ExternalLinkage,
        llvm.ConstantStruct.get(structType, values as llvm.Constant[])
      );
    } else {
      const alloc = this.cgen.builder.createAlloca(structType, undefined, varName);

      for (let i = 0; i < values.length; i++) {
        const ptr = this.cgen.builder.createInBoundsGEP(alloc, [
          llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
          llvm.ConstantInt.get(this.cgen.context, i, 32, true)
        ]);
        this.cgen.builder.createStore(values[i], ptr);
      }
      return alloc;
    }
  }

  private genPropertyAssignment(node: ts.PropertyAssignment): llvm.Value {
    return this.cgen.genExpression(node.initializer);
  }
}

export function genTypesHash(types: llvm.Type[]): string {
  return digestToHex(types.map(t => t.typeID).join('-'));
}

export function digestToHex(buf: Buffer | string): string {
  return crypto
    .createHash('md5')
    .update(buf)
    .digest()
    .toString('hex');
}
