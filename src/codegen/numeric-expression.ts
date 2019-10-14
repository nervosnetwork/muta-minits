import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenNumeric {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genNumeric(node: ts.NumericLiteral): llvm.ConstantInt {
    if (this.cgen.currentFunction) {
      return this.genNumericLocale(node);
    } else {
      return this.genNumericGlobal(node);
    }
  }

  public genNumericLocale(node: ts.NumericLiteral): llvm.ConstantInt {
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

  public genNumericGlobal(node: ts.NumericLiteral): llvm.ConstantInt {
    return this.genNumericLocale(node);
  }
}
