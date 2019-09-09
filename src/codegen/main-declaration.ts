import llvm from 'llvm-node';
import ts from 'typescript';

import { DepType, NodeDepends } from '../types';
import LLVMCodeGen from './';

export default class MainDeclaration {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genMainFunction(): void {
    this.genDepends(this.cgen.nodeDep);
  }

  private genDepends(deps: NodeDepends): void {
    const { self, depends, depType, hashName } = deps;

    if (depType !== DepType.func) {
      return;
    }

    if (this.cgen.symtab.tryGet(hashName)) {
      return;
    }

    const funcArgTypes: llvm.Type[] = [];
    let funcRetType: llvm.Type | null = null;

    depends.forEach(dep => {
      switch (dep.depType) {
        case DepType.paramType:
          funcArgTypes.push(this.cgen.genType(dep.self as ts.TypeNode));
          return;
        case DepType.retType:
          funcRetType = this.cgen.genType(dep.self as ts.TypeNode);
          return;
        default:
          this.genDepends(dep);
      }
    });

    funcRetType = funcRetType ? funcRetType : llvm.Type.getVoidTy(this.cgen.context);

    this.cgen.genFunctionDeclarationWithSignature(self as ts.FunctionDeclaration, funcArgTypes, funcRetType, hashName);
  }
}
