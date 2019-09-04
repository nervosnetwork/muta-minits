import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenElemAccess {
  private readonly cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genElementAccess(node: ts.ElementAccessExpression): llvm.Value {
    const symbol = this.cgen.checker.getSymbolAtLocation(node.expression)!;
    const type = this.cgen.checker.getTypeOfSymbolAtLocation(symbol, node.expression);
    if (type.flags === ts.TypeFlags.String) {
      return this.cgen.cgString.genElementAccess(node);
    }
    return this.cgen.cgArray.genElementAccess(node);
  }
}
