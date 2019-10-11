import assert from 'assert';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenExport {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  // Internal/external variables have not been implemented yet.
  public genExportDeclaration(expr: ts.ExportDeclaration): void {
    assert(this.cgen);
    assert(expr);
    return;
  }
}
