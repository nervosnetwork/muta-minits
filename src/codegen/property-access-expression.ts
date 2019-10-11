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
    if (node.expression.kind === ts.SyntaxKind.Identifier) {
      const parent = this.cgen.symtab.get((node.expression as ts.Identifier).getText());
      if (symtab.isScope(parent)) {
        const son = parent.inner.get(node.name.getText())! as symtab.LLVMValue;
        let r = son.inner;
        for (let i = 0; i < son.deref; i++) {
          r = this.cgen.builder.createLoad(r);
        }
        return r;
      }
    }
    if (this.cgen.cgString.isStringLiteral(node.expression)) {
      return this.cgen.cgString.genPropertyAccessExpression(node);
    }
    return this.cgen.cgObject.genPropertyAccessExpression(node);
  }
}
