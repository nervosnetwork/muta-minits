import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';
import * as common from '../common';

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
    const name = (() => {
      if (node.name) {
        const real = node.name as ts.Identifier;
        return real.getText();
      } else {
        return undefined;
      }
    })();
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const func = llvm.Function.create(fnty, linkage, name, this.cgen.module);

    this.cgen.symtab.into();
    this.initArguments(func, node);
    if (node.body) {
      const body = llvm.BasicBlock.create(this.cgen.context, 'body', func);
      this.cgen.currentFunction = func;
      this.cgen.builder.setInsertionPoint(body);

      this.cgen.genBlock(node.body);
    }
    this.cgen.symtab.exit();
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

          this.cgen.symtab.set(item.name, { value: item, deref: 0, fields });
          break;
        default:
          this.cgen.symtab.set(item.name, { value: item, deref: 0 });
      }
    });
  }
}
