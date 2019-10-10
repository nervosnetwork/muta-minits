import fs from 'fs';
import path from 'path';
import ts from 'typescript';

// Dependency tree takes in a starting file, extracts its declared dependencies via precinct, resolves each of those
// dependencies to a file on the filesystem via filing-cabinet, then recursively performs those steps until there are
// no more dependencies to process.
//
// GA: DFS.
export function getDependency(mainFile: string): string[] {
  const open: string[] = [mainFile];
  const closed: string[] = [];

  while (open.length !== 0) {
    const name = open.pop()!;
    const sourceFile = ts.createSourceFile(name, fs.readFileSync(name).toString(), ts.ScriptTarget.ES2020, true);
    sourceFile.forEachChild(node => {
      if (!ts.isImportDeclaration(node)) {
        return;
      }
      const importNode = node as ts.ImportDeclaration;
      const relPath = (importNode.moduleSpecifier as ts.StringLiteral).text + '.ts';
      const absPath = path.join(path.dirname(name), relPath);
      if (closed.includes(absPath)) {
        return;
      }
      open.push(absPath);
    });
    closed.push(name);
  }
  return closed;
}
