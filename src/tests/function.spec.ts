import test from 'ava';
import { runCode } from './util';

test('test function call', async t => {
  await runCode(
    `
    function echo(n: number): number {
        return n;
    }

    function main(): number {
        let a = echo(42);
        let n = 42;
        let b = echo(n);
        return a + b; // 84
    }
    `
  );

  t.pass();
});

test('test function return 0', async t => {
  await runCode(
    `
    function main(): number {
        return 0;
    }
    `
  );

  t.pass();
});

test('test function return 1', async t => {
  await runCode(
    `
    function main(): number {
        return 1;
    }
    `
  );

  t.pass();
});
