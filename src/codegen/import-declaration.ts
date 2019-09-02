import path from 'path';
import ts from 'typescript';

import { completionSuffix, trimQuotes } from '../common';
import { Scope } from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenImport {
  private cgen: LLVMCodeGen;
  private maps: Map<string, Scope>;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
    this.maps = new Map();
  }

  public genImportDeclaration(node: ts.ImportDeclaration): void {
    const libName = (node.importClause!.namedBindings as ts.NamespaceImport).name.text;
    const importRelativePath = trimQuotes(node.moduleSpecifier.getText());
    const libPath = completionSuffix(path.join(this.cgen.rootDir, importRelativePath));
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
