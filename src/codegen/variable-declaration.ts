import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenArray {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genVariableDeclaration(node: ts.VariableDeclaration): void {
    this.cgen.withType(node.type, () => {
      const name = node.name.getText();
      const initializer = this.cgen.genExpression(node.initializer!);
      const type = initializer.type;

      if (this.cgen.currentFunction) {
        const alloca = this.cgen.builder.createAlloca(type, undefined, name);
        this.cgen.builder.createStore(initializer, alloca);
        this.cgen.symtab.set(name, new symtab.Leaf(alloca, 1));
        return;
      }

      switch (node.initializer!.kind) {
        case ts.SyntaxKind.NumericLiteral:
          this.cgen.symtab.set(name, new symtab.Leaf(this.cgen.genGlobalVariable(initializer as llvm.Constant), 1));
          break;
        case ts.SyntaxKind.StringLiteral:
          this.cgen.symtab.set(name, new symtab.Leaf(this.cgen.genGlobalVariable(initializer as llvm.Constant), 1));
          break;
        case ts.SyntaxKind.ArrayLiteralExpression:
          this.cgen.symtab.set(name, new symtab.Leaf(initializer, 0));
          break;
        case ts.SyntaxKind.ObjectLiteralExpression:
          this.cgen.symtab.set(name, new symtab.Leaf(initializer, 0));
          break;
      }
      return;
    });
    return;
  }
}
