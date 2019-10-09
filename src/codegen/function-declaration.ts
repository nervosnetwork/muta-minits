import llvm from 'llvm-node';
import ts from 'typescript';

import * as common from '../common';
import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genFunctionDeclarationWithSignature(
    node: ts.FunctionDeclaration,
    args: llvm.Type[],
    ret: llvm.Type,
    hashName: string
  ): llvm.Function {
    return this.genFunction(node, args, ret, hashName);
  }

  private genFunction(
    node: ts.FunctionDeclaration,
    funcArgsType: llvm.Type[],
    funcReturnType: llvm.Type,
    hashName: string
  ): llvm.Function {
    const fnty = llvm.FunctionType.get(funcReturnType, funcArgsType, false);
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const func = llvm.Function.create(fnty, linkage, this.cgen.symtab.name() + hashName, this.cgen.module);
    if (hashName === 'main') {
      func.addFnAttr(llvm.Attribute.AttrKind.NoInline);
      func.addFnAttr(llvm.Attribute.AttrKind.OptimizeNone);
    }
    this.cgen.symtab.set(hashName, new symtab.LLVMValue(func, 0));

    this.cgen.symtab.with(undefined, () => {
      func.getArguments().forEach(item => {
        item.name = node.parameters[item.argumentNumber].name.getText();
        this.cgen.symtab.set(item.name, new symtab.LLVMValue(item, 0));
      });
      if (node.body) {
        const body = llvm.BasicBlock.create(this.cgen.context, 'body', func);
        this.cgen.builder.setInsertionPoint(body);
        this.cgen.withFunction(func, () => {
          this.cgen.genBlock(node.body!);
          if (!this.cgen.builder.getInsertBlock()!.getTerminator()) {
            this.cgen.builder.createRetVoid();
          }
        });
      }
    });

    if (node.type) {
      const realType = common.findRealType(funcReturnType);
      if (realType.isStructTy()) {
        this.cgen.symtab.set(realType.name!, new symtab.LLVMValue(func, 0));
      }
    }
    return func;
  }
}
