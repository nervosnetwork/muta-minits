import test from 'ava';
import { runCode } from './util';

const srcForOfArray = `
let globalarr = [1, 2, 3];

function main(): number {
    let localearr = [4, 5, 6];
    let emptyarr: number[] = [];
    let s: number = 0;
    for (let v of globalarr) {
        s += v;
    }
    for (let v of localearr) {
        s += v;
    }
    for (let v of [1, 2, 3]) {
        s += v;
    }
    for (let v of emptyarr) {
        s += v;
    }
    return s; // 27
}
`;

test('test statement for of', async t => {
  await runCode(srcForOfArray);
  t.pass();
});
