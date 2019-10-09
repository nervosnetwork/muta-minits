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

test('test for of array', async t => {
  if (await runCode(srcForOfArray)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcForOfString = `
function main(): number {
    let a = "Hello";
    let s = "";
    for (let i of a) {
        s = s + i;
    }
    for (let i of "World") {
        s = s + i;
    }
    if (s !== "HelloWorld") {
        return 1;
    }
    return 0;
}
`;

test('test for of string', async t => {
  if (await runCode(srcForOfString)) {
    t.pass();
  } else {
    t.fail();
  }
});
