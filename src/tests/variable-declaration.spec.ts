import { runTest } from './util';

const srcGlobalVar = `
let a: number = 1;
let b: number[] = [2, 3];

function main(): number {
    let c = 4;
    return a + b[0] + c;
}
`;

const srcTypeInference = `
function main(): number {
    let a = 10; // Skip the annotation type
    let b: number = 20;
    return a + b;
}
`;

runTest('test variable declaration: global var', srcGlobalVar);
runTest('test variable declaration: type inference', srcTypeInference);
