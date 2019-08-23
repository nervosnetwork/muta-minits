// [0] https://stackoverflow.com/questions/1061753/how-can-i-implement-a-string-data-type-in-llvm
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenString {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genStringLiteral(node: ts.StringLiteral): llvm.Value {
    return this.cgen.builder.createGlobalStringPtr(node.text, 'string');
  }
}
