import llvm from 'llvm-node';
import ts from 'typescript';

import * as common from '../common';
import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genFunctionDeclaration(node: ts.FunctionDeclaration): llvm.Function {
    const funcReturnType = this.cgen.genType(node.type!);
    const funcArgsType = node.parameters.map(item => {
      return this.cgen.genType(item.type!);
    });
    const fnty = llvm.FunctionType.get(funcReturnType, funcArgsType, false);
    const name = (node.name as ts.Identifier).text;
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const func = llvm.Function.create(fnty, linkage, name, this.cgen.module);

    this.cgen.symtab.with(name, () => {
      this.initArguments(func, node);
      if (node.body) {
        const body = llvm.BasicBlock.create(this.cgen.context, 'body', func);
        this.cgen.builder.setInsertionPoint(body);
        this.cgen.withFunction(func, () => {
          this.cgen.genBlock(node.body!);
        });
      }
    });
    return func;
  }

  private initArguments(func: llvm.Function, node: ts.FunctionDeclaration): void {
    func.getArguments().forEach(item => {
      item.name = node.parameters[item.argumentNumber].name.getText();

      switch (common.findRealType(item.type).typeID) {
        case llvm.Type.TypeID.StructTyID:
          const fields = common.buildStructMaps(
            item.type as llvm.StructType,
            node.parameters[item.argumentNumber].type! as ts.TypeLiteralNode
          );

          this.cgen.symtab.set(item.name, { inner: item, deref: 0, fields });
          break;
        default:
          this.cgen.symtab.set(item.name, { inner: item, deref: 0 });
      }
    });
  }
}
