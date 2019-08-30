import test from 'ava';
import { runCode } from './util';

test('test factorial', async t => {
  await runCode(
    `
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
    `
  );

  t.pass();
});

test('test fibonacci', async t => {
  await runCode(
    `
    // In mathematics, the Fibonacci numbers,
    // commonly denoted Fn form a sequence, called the Fibonacci sequence, such that
    // each number is the sum of the two preceding ones, starting from 0 and 1. That is
    //
    // F(0) = 0
    // F(1) = 1
    // F(n) = F(n − 1) + F(n − 2)
    function fibo(n: number): number {
        if (n < 2) {
            return n;
        }
        return fibo(n - 1) + fibo(n - 2);
    }

    function main(): number {
        return fibo(10);
    }
    `
  );

  t.pass();
});
