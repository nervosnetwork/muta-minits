import Debug from 'debug';
import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

const debug = Debug('minits:codegen');

interface LLVMFunctionWithTsDeclaration {
  func: llvm.Function;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  body: ts.Block;
}

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;
  private list: LLVMFunctionWithTsDeclaration[];

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
    this.list = [];
  }

  public genFunctionDeclaration(node: ts.FunctionDeclaration): void {
    if (node.modifiers && node.modifiers[0].kind === ts.SyntaxKind.DeclareKeyword) {
      return;
    }
    const funcReturnType = this.cgen.genType(node.type!);
    const funcArgsType = node.parameters.map(item => {
      return this.cgen.genType(item.type!);
    });
    const fnty = llvm.FunctionType.get(funcReturnType, funcArgsType, false);
    const name = (node.name as ts.Identifier).text;
    const linkage = llvm.LinkageTypes.ExternalLinkage;
    const show = this.cgen.symtab.name() + name;
    debug(`Declare function ${show}`);
    const func = llvm.Function.create(fnty, linkage, show, this.cgen.module);
    if (name === 'main') {
      func.addFnAttr(llvm.Attribute.AttrKind.NoInline);
      func.addFnAttr(llvm.Attribute.AttrKind.OptimizeNone);
    }
    this.cgen.symtab.set(name, new symtab.Leaf(func, 0));
    this.list.push({ func, parameters: node.parameters, body: node.body! });
    return;
  }

  public genImplemention(): void {
    for (const { func, parameters, body } of this.list) {
      this.cgen.symtab.with('', () => {
        func.getArguments().forEach(item => {
          item.name = parameters[item.argumentNumber].name.getText();
          this.cgen.symtab.set(item.name, new symtab.Leaf(item, 0));
        });
        const bd = llvm.BasicBlock.create(this.cgen.context, 'body', func);
        this.cgen.builder.setInsertionPoint(bd);
        this.cgen.withFunction(func, () => {
          this.cgen.genBlock(body);
          if (!this.cgen.builder.getInsertBlock()!.getTerminator()) {
            this.cgen.builder.createRetVoid();
          }
        });
      });
    }
  }
}
