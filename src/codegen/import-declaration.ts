import path from 'path';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenImport {
  private cgen: LLVMCodeGen;
  private maps: Map<string, symtab.Meso>;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
    this.maps = new Map();
  }

  public genImportDeclaration(node: ts.ImportDeclaration): void {
    const libName = (node.importClause!.namedBindings as ts.NamespaceImport).name.text;
    const importRelativePath = (node.moduleSpecifier as ts.StringLiteral).text;
    const libPath = path.join(this.cgen.rootDir, importRelativePath) + '.ts';
    if (this.maps.has(libPath)) {
      this.cgen.symtab.set(libName, this.maps.get(libPath)!);
      return;
    }

    this.cgen.symtab.with(libName, () => {
      this.cgen.genSourceFile(libPath);
      this.maps.set(libPath, this.cgen.symtab.data);
    });
  }
}
