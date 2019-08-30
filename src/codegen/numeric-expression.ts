import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenNumeric {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genNumeric(node: ts.NumericLiteral): llvm.ConstantInt {
    const text = node.getText();
    const bits = (() => {
      if (text.startsWith('0x')) {
        return 16;
      } else {
        return 10;
      }
    })();
    return llvm.ConstantInt.get(this.cgen.context, parseInt(text, bits), 64);
  }

  public genNumericGlobal(node: ts.NumericLiteral): llvm.GlobalVariable {
    const initializer = this.cgen.genNumeric(node);
    const type = initializer.type;
    const r = new llvm.GlobalVariable(
      this.cgen.module,
      type,
      false,
      llvm.LinkageTypes.ExternalLinkage,
      initializer,
      this.cgen.symtab.name() + this.cgen.readName()
    );
    return r;
  }
}
