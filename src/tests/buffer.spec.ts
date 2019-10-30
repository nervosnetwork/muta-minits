import { runTest } from './util';

const srcGetAndSet = `
function main(): number {
    let a = new Buffer(10);
    a[0] = 278;
    return a[0];
}
`;

const srcNewWithNumberArray = `
function main(): number {
    let a = new Buffer([1, 2000, 3]);
    return a[1];
}
`;

runTest('test buffer: get and set', srcGetAndSet);
runTest('test buffer: new with number array', srcNewWithNumberArray);
