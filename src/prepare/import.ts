import fs from 'fs';
import path from 'path';
import ts from 'typescript';

import { completionSuffix, trimQuotes } from '../common';

export default class PrepareImport {
  private readonly mainFile: string;
  private readonly sourceFile: ts.SourceFile;

  constructor(mainFile: string) {
    const sourceFile = ts.createSourceFile(
      mainFile,
      fs.readFileSync(mainFile).toString(),
      ts.ScriptTarget.ES2020,
      true
    );

    this.mainFile = mainFile;
    this.sourceFile = sourceFile;
  }

  public getImportFiles(): string[] {
    const rootDir = this.getRoot();
    const pathSet: Set<string> = new Set();
    pathSet.add(this.mainFile);

    this.sourceFile.forEachChild(node => {
      if (ts.isImportDeclaration(node)) {
        const importNode = node as ts.ImportDeclaration;
        const importRelativePath = trimQuotes(importNode.moduleSpecifier.getText());

        // TODO(@yejiayu): The case of import a system module needs to be handled.
        // if (importRelativePath.isSystemModule) {
        //
        // }
        const importPath = completionSuffix(path.join(rootDir, importRelativePath));

        if (pathSet.has(importPath)) {
          return;
        }

        pathSet.add(importPath);
        new PrepareImport(importPath).getImportFiles().forEach(p => pathSet.add(p));
      }
    });

    return Array.from(pathSet.values());
  }

  public getRoot(): string {
    return path.dirname(this.mainFile);
  }
}
