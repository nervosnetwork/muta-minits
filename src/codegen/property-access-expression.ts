import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenPropertyAccessExpression {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): llvm.Value {
    const parent = (() => {
      if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
        return this.fromScope(node.expression as ts.PropertyAccessExpression);
      } else {
        return this.cgen.symtab.get((node.expression as ts.Identifier).getText());
      }
    })();

    if (symtab.isScope(parent)) {
      const son = parent.inner.get(node.name.getText())! as symtab.LLVMValue;
      let r = son.inner;
      for (let i = 0; i < son.deref; i++) {
        r = this.cgen.builder.createLoad(r);
      }
      return r;
    }
    return this.cgen.cgObject.genObjectElementAccess(node);
  }

  private fromScope(node: ts.PropertyAccessExpression): symtab.Value {
    const parent = this.cgen.symtab.get((node.expression as ts.Identifier).getText()) as symtab.Scope;
    return parent.inner.get(node.name.getText())!;
  }
}
