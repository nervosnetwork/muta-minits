import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenSwitch {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genSwitchStatement(node: ts.SwitchStatement): void {
    const caseArr = [...node.caseBlock.clauses];
    const genNode = (v: ts.CaseOrDefaultClause, i: number, a: ts.CaseOrDefaultClause[]): ts.Statement => {
      if (v.kind === ts.SyntaxKind.CaseClause) {
        return ts.createIf(
          ts.createBinary(node.expression, ts.createToken(ts.SyntaxKind.EqualsEqualsToken), v.expression),
          ts.createBlock(v.statements, true),
          ts.createBlock([genNode(a[i + 1], i + 1, a)], true)
        );
      }
      if (v.kind === ts.SyntaxKind.DefaultClause) {
        return ts.createBlock(v.statements, true);
      }
      throw new Error(''); // Should never reach this
    };

    this.cgen.genStatement(genNode(caseArr[0], 0, caseArr));
  }
}
