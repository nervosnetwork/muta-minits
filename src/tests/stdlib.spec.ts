import { runTest } from './util';

const srcConsoleLog = `
let globalstr = "globalstr";

function main(): number {
    let localstr = "localstr";
    console.log(globalstr);
    console.log(localstr);
    console.log("%s", globalstr);
    console.log("%s", localstr);
    console.log("%d", 42);
    return 0;
}
`;

const srcAtoI = `
function main(): number {
    const s = "100";
    let d: number = parseInt(s);
    d += 5; // 105
    return d;
}
`;

runTest('test stdlib: console.log', srcConsoleLog);
runTest('test stdlib: atoi', srcAtoI);
