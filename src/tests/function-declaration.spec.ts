import test from 'ava';
import { runCode } from './util';

const srcFunctionCall = `
function echo(n: number): number {
    return n;
}

function main(): number {
    let a = echo(42);
    let n = 42;
    let b = echo(n);
    return a + b; // 84
}
`;

test('test function call', async t => {
  if (await runCode(srcFunctionCall)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcFunctionReturnZero = `
function main(): number {
    return 0;
}
`;

test('test function return 0', async t => {
  if (await runCode(srcFunctionReturnZero)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcFunctionReturnOne = `
function main(): number {
    return 1;
}
`;

test('test function return 1', async t => {
  if (await runCode(srcFunctionReturnOne)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcFunctionIgnoreReturn = `
function echo() {
  console.log("Hello World!");
}

function main(): number {
  echo();
  return 0;
}
`;

test('test function ignore return', async t => {
  if (await runCode(srcFunctionIgnoreReturn)) {
    t.pass();
  } else {
    t.fail();
  }
});
