import ts from 'typescript';

import { NodeDepends } from '../types';
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
    const { self, depends } = deps;

    depends.forEach(dep => {
      this.genDepends(dep);
    });

    this.cgen.genFunctionDeclaration(self as ts.FunctionDeclaration);
  }
}
