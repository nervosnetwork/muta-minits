import test from 'ava';
import { runCode } from './util';

const srcArray = `
let globalarr = [1, 2, 3];

function main(): number {
    let localearr = [4, 5, 6];
    let s: number = 0;
    s += globalarr[0];
    s += localearr[0];
    s += [1, 2, 3][0];
    return s; // 6
}
`;

test('test element access array', async t => {
  await runCode(srcArray);
  t.pass();
});

const srcString = `
let globalstr = "Hello";

function main(): number {
  let localestr = "Hello";
  if (globalstr[0] !== "H") {
    return 1;
  }
  if (localestr[0] !== "H") {
    return 1;
  }
  if ("Hello"[0] !== "H") {
    return 1;
  }
  return 0;
}
`;

test('test element access string', async t => {
  await runCode(srcString);
  t.pass();
});
