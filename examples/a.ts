import ts from 'typescript';
import fs from 'fs';

const program = ts.createProgram(['/src/sandbox/main.ts'], {});
const checker = program.getTypeChecker();
const sources = program.getSourceFile('/src/sandbox/main.ts')!;
const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
});
const r: string[] = [];
const tmpPath = '/tmp/main.ts'
const tmpFile = ts.createSourceFile(tmpPath,  fs.readFileSync('/src/sandbox/main.ts').toString(), ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
sources.forEachChild(node => {
    r.push(printer.printNode(ts.EmitHint.Unspecified, node, tmpFile));
    r.push('\n');
});
console.log(checker)
console.log(r) // [ 'let a = ;', '\n', '', '\n' ]

// [ 'let a = "DDDD";', '\n', '', '\n' ]
