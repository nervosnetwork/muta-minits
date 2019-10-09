import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenBoolean {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genBoolean(node: ts.BooleanLiteral): llvm.ConstantInt {
    switch (node.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return llvm.ConstantInt.get(this.cgen.context, 0, 1);
      case ts.SyntaxKind.TrueKeyword:
        return llvm.ConstantInt.get(this.cgen.context, 1, 1);
      default:
        throw new Error('Unsupported boolean value');
    }
  }
}
