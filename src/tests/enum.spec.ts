import test from 'ava';
import { runCode } from './util';

test('test enum initializer', async t => {
  await runCode(
    `
    enum Test {
      a = 100,
      b = 101,
      c = 102
    }

    function main(): number {
      return Test.a;
    }
    `
  );

  t.pass();
});

test('test enum iota', async t => {
  await runCode(
    `
    enum Test {
      a = 100,
      b,
      c = 103
    }

    function main(): number {
      return Test.b;
    }
    `
  );

  t.pass();
});

test('test enum return', async t => {
  await runCode(
    `
    enum Test {
      a,
      b
    }

    function main(): Test {
      return Test.a;
    }
    `
  );

  t.pass();
});

test('test enum var', async t => {
  await runCode(
    `
    enum Test {
      a,
      b
    }

    function test(t: Test): number {
      return t;
    }

    function main(): number {
      return test(Test.b);
    }
    `
  );

  t.pass();
});

test('test enum plus', async t => {
  await runCode(
    `
    enum Test {
      a = 100,
      b = 101
    }

    function test(n: number): number {
      return n;
    }

    function main(): number {
      test(1 + Test.a);
      return test(Test.b + 1);
    }
    `
  );

  t.pass();
});
