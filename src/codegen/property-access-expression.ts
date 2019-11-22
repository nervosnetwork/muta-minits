import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenPropertyAccessExpression {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public getPropertyAccessExpression(node: ts.PropertyAccessExpression): symtab.Node {
    let parent: symtab.Node;
    if (node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      parent = this.getPropertyAccessExpression(node.expression as ts.PropertyAccessExpression);
    } else if (node.expression.kind === ts.SyntaxKind.Identifier) {
      parent = this.cgen.symtab.get((node.expression as ts.Identifier).getText());
    } else {
      parent = new symtab.Leaf(this.cgen.genExpression(node.expression), 0);
    }

    if (symtab.isMeso(parent)) {
      return parent.data.get(node.name.getText())!;
    } else if (this.cgen.cgString.isStringLiteral(node.expression)) {
      const p = parent as symtab.Leaf;
      let v = p.data;
      for (let i = 0; i < p.ptrs; i++) {
        v = this.cgen.builder.createLoad(v);
      }
      const e = this.cgen.cgString.getPropertyAccessExpression(v, node.name.getText());
      return new symtab.Leaf(e, 0);
    } else {
      const e = this.cgen.cgObject.genPropertyAccessExpression(node);
      return new symtab.Leaf(e, 0);
    }
  }

  public genPropertyAccessExpression(node: ts.PropertyAccessExpression): llvm.Value {
    const real = this.getPropertyAccessExpression(node) as symtab.Leaf;
    let r = real.data;
    for (let i = 0; i < real.ptrs; i++) {
      r = this.cgen.builder.createLoad(r);
    }
    return r;
  }
}
