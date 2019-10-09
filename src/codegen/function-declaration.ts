import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

interface LLVMFunctionWithTsDeclaration {
  func: llvm.Function;
  node: ts.FunctionDeclaration;
}

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;
  private list: LLVMFunctionWithTsDeclaration[];

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
    this.list = [];
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
    this.list.push({ func, node });
    return func;
  }

  public genImplemention(): void {
    for (const { func, node } of this.list) {
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
            if (!body.getTerminator()) {
              this.cgen.builder.createRetVoid();
            }
          });
        }
      });
    }
  }
}
