import fs from 'fs';
import path from 'path';
import ts from 'typescript';

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
    const relPath = (node.moduleSpecifier as ts.StringLiteral).text;
    const libPath = path.join(path.dirname(this.cgen.module.sourceFileName), relPath) + '.ts';
    if (this.maps.has(libPath)) {
      this.cgen.symtab.set(libName, this.maps.get(libPath)!);
      return;
    }

    const sourceFile = ts.createSourceFile(libPath, fs.readFileSync(libPath).toString(), ts.ScriptTarget.ES2020, true);
    this.cgen.symtab.with(libName, () => {
      this.cgen.genSourceFile(sourceFile);
      this.maps.set(libPath, this.cgen.symtab.data);
    });
  }
}
