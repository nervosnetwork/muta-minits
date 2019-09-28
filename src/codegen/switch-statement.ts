import assert from 'assert';
import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenSwitch {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genSwitchStatement(node: ts.SwitchStatement): void {
    assert(this.cgen);
    assert(node);
    assert(llvm.Type);
  }
}
