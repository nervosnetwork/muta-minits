import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenNew {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genNewExpression(node: ts.NewExpression): llvm.Value {
    if (node.expression.kind === ts.SyntaxKind.Identifier) {
      const name = (node.expression as ts.Identifier).getText();
      switch (name) {
        case 'Buffer':
          const n = parseInt((node.arguments![0] as ts.NumericLiteral).getText(), 10);
          const arrayType = llvm.ArrayType.get(llvm.Type.getInt8Ty(this.cgen.context), n);
          const arrayPtr = this.cgen.builder.createAlloca(arrayType);
          return this.cgen.builder.createInBoundsGEP(arrayPtr, [
            llvm.ConstantInt.get(this.cgen.context, 0, 64),
            llvm.ConstantInt.get(this.cgen.context, 0, 64)
          ]);
        default:
          throw new Error('Unsupported struct');
      }
    }

    return llvm.ConstantInt.get(this.cgen.context, 10, 64);
  }
}
