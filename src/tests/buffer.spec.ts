import { runTest } from './util';

const srcGetAndSet = `
function main(): number {
    let a = new Buffer(10);
    a[0] = 278;
    return a[0];
}
`;

runTest('test buffer: get and set', srcGetAndSet);
