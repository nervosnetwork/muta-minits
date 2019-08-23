import llvm from 'llvm-node';
import ts from 'typescript';

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
    func.getArguments().forEach(item => {
      item.name = node.parameters[item.argumentNumber].name.getText();
      this.cgen.symtab.set(item.name, { value: item });
    });
    if (node.body) {
      const body = llvm.BasicBlock.create(this.cgen.context, 'body', func);
      this.cgen.currentFunction = func;
      this.cgen.builder.setInsertionPoint(body);
      this.cgen.genBlock(node.body);
    }
    this.cgen.symtab.exit();
    return func;
  }
}
