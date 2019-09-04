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

  public genFunctionDeclaration(node: ts.FunctionDeclaration): llvm.Function {
    const funcReturnType = (() => {
      if (node.type) {
        return this.cgen.genType(node.type);
      } else {
        return llvm.Type.getVoidTy(this.cgen.context);
      }
    })();
    const funcArgsType = node.parameters.map(item => {
      return this.cgen.genType(item.type!);
    });
    const fnty = llvm.FunctionType.get(funcReturnType, funcArgsType, false);
    const name = (node.name as ts.Identifier).text;
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const func = llvm.Function.create(fnty, linkage, this.cgen.symtab.name() + name, this.cgen.module);
    if (name === 'main') {
      func.addFnAttr(llvm.Attribute.AttrKind.NoInline);
      func.addFnAttr(llvm.Attribute.AttrKind.OptimizeNone);
    }
    this.cgen.symtab.set(name, new symtab.LLVMValue(func, 0));

    this.cgen.symtab.with(undefined, () => {
      this.initArguments(func, node);
      if (node.body) {
        const body = llvm.BasicBlock.create(this.cgen.context, 'body', func);
        this.cgen.builder.setInsertionPoint(body);
        this.cgen.withFunction(func, () => {
          this.cgen.genBlock(node.body!);
          if (!body.getTerminator()) {
            this.cgen.builder.createRetVoid();
          }
        });
      }
    });

    if (node.type && common.findRealType(funcReturnType).isStructTy()) {
      const typeLiteral = node.type! as ts.TypeLiteralNode;
      const fields = common.buildStructMaps(funcReturnType as llvm.StructType, typeLiteral);

      this.cgen.symtab.set(name, new symtab.LLVMValue(func, 0, fields));
    }
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

          this.cgen.symtab.set(item.name, new symtab.LLVMValue(item, 0, fields));
          break;
        default:
          this.cgen.symtab.set(item.name, new symtab.LLVMValue(item, 0));
      }
    });
  }
}
