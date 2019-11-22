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
          return this.cgen.cgInt8Array.genNewExpression(node);
        default:
          const type = this.cgen.module.getTypeByName(name)!;
          const alloc = this.cgen.builder.createAlloca(type);

          const func = this.cgen.module.getFunction(name + '_constructor')!;
          let args = node.arguments!.map(e => this.cgen.genExpression(e));
          args = [alloc, ...args];
          this.cgen.builder.createCall(func, args);
          return alloc;
      }
    }
    throw new Error(`Failed to initialize struct: ${node.getText()}`);
  }
}
