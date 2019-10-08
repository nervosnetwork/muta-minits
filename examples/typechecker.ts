import * as ts from "typescript";

let program = ts.createProgram(['/src/sandbox/test.ts'], {});
let checker = program.getTypeChecker();
let source = program.getSourceFile('/src/sandbox/test.ts')!;

source.forEachChild(node => {
    switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
            (() => {
                let real = node as ts.VariableStatement;
                real.declarationList.declarations.forEach(item => {
                    (() => {
                        let real = item as ts.VariableDeclaration;

                        let type = checker.getTypeAtLocation(real.initializer!);
                        if (type.flags === ts.TypeFlags.Object) {
                            console.log((type as ts.TypeReference).typeArguments![0].flags);
                        }
                        // if ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
                        //     return (type as ts.TypeReference).typeArguments || [];
                        // }


                        // console.log(real.name.getText());

                        // const symbol = checker.getSymbolAtLocation(real.name)!;
                        // const type = checker.getTypeOfSymbolAtLocation(symbol, real.initializer!);

                        // console.log(type.getApparentProperties());

                    })()
                });
            })()
            break;
        // case ts.SyntaxKind.VariableDeclaration:
        //     console.log("DDDDD");
        //     (() => {
        //         let real = node as ts.VariableDeclaration;
        //         console.log(real.name);

        //         const symbol = checker.getSymbolAtLocation(real.name)!;
        //         const type = checker.getTypeOfSymbolAtLocation(symbol, real.initializer!);

        //         console.log(symbol, type);

        //     })()
        //     break;
        default:
            console.log('opus')
            break
    }
});
