import { runTest } from './util';

const srcGetAndSet = `
function main(): number {
    let a = new Int8Array(10);
    a[0] = 278;
    return a[0];
}
`;

const srcNewWithNumberArray = `
function main(): number {
    let a = new Int8Array([1, 2000, 3]);
    return a[1];
}
`;

const srcReturnByFunction = `
function func(): Int8Array {
    return new Int8Array([0, 1, 2, 3]);
}

function main(): number {
    const r = func();
    return r[3];
}
`;

runTest('test buffer: get and set', srcGetAndSet);
runTest('test buffer: new with number array', srcNewWithNumberArray);
runTest('test buffer: return by func', srcReturnByFunction);
