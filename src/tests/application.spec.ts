import test from 'ava';
import { runCode } from './util';

const srcFactorial = `
function factorial(n: number): number {
    let s: number = 1;
    for (let i: number = 1; i <= n; i++) {
        s = s * i;
    }
    return s;
}

function main(): number {
  return factorial(5); // 120
}
`;

test('test factorial', async t => {
  if (await runCode(srcFactorial)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcFibonacci = `
function fibo(n: number): number {
    if (n < 2) {
        return n;
    }
    return fibo(n - 1) + fibo(n - 2);
}

function main(): number {
    return fibo(10);
}
`;

test('test fibonacci', async t => {
  if (await runCode(srcFibonacci)) {
    t.pass();
  } else {
    t.fail();
  }
});
