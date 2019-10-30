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
        case 'Int8Array':
          switch (node.arguments![0].kind) {
            case ts.SyntaxKind.NumericLiteral:
              const n = parseInt((node.arguments![0] as ts.NumericLiteral).getText(), 10);
              const arrayType = llvm.ArrayType.get(llvm.Type.getInt8Ty(this.cgen.context), n);
              const arrayPtr = this.cgen.builder.createAlloca(arrayType);
              return this.cgen.builder.createInBoundsGEP(arrayPtr, [
                llvm.ConstantInt.get(this.cgen.context, 0, 64),
                llvm.ConstantInt.get(this.cgen.context, 0, 64)
              ]);
            case ts.SyntaxKind.ArrayLiteralExpression:
              return (() => {
                const expr = node.arguments![0] as ts.ArrayLiteralExpression;
                const l = expr.elements.length;
                const arrayType = llvm.ArrayType.get(llvm.Type.getInt8Ty(this.cgen.context), l);
                const arrayPtr = this.cgen.builder.createAlloca(arrayType);
                for (let i = 0; i < l; i++) {
                  const item = this.cgen.builder.createIntCast(
                    this.cgen.genExpression(expr.elements[i]),
                    llvm.Type.getInt8Ty(this.cgen.context),
                    true
                  );

                  const ptr = this.cgen.builder.createInBoundsGEP(arrayPtr, [
                    llvm.ConstantInt.get(this.cgen.context, 0, 64),
                    llvm.ConstantInt.get(this.cgen.context, i, 64)
                  ]);
                  this.cgen.builder.createStore(item, ptr);
                }
                return this.cgen.builder.createInBoundsGEP(arrayPtr, [
                  llvm.ConstantInt.get(this.cgen.context, 0, 64),
                  llvm.ConstantInt.get(this.cgen.context, 0, 64)
                ]);
              })();
            default:
              throw new Error('Upsupported grammar');
          }
        default:
          throw new Error('Unsupported struct');
      }
    }

    return llvm.ConstantInt.get(this.cgen.context, 10, 64);
  }
}
