import test from 'ava';
import { runCode } from './util';

test('test object call mut', async t => {
  await runCode(
    `
    function mut(obj: { num: number; str: string }): void {
      obj.num = 100;
      obj.str = 'hello world';
      return;
    }

    function main(): number {
      let testObj = {
        num: 10,
        str: '123'
      };

      mut(testObj);
      if (testObj.str !== 'hello world') {
        return 1;
      }
      return testObj.num;
    }
    `
  );

  t.pass();
});

test('test object return number', async t => {
  await runCode(
    `
    const Test = {
      a: 1,
      d: 12
    };

    function main(): number {
      const Test = {
        a: 1,
        c: 10
      };

      return Test.c;
    }
    `
  );

  t.pass();
});

test('test object return string', async t => {
  await runCode(
    `
    const Test = {
      a: 1
    };

    function main(): number {
      const Test = {
        a: 1,
        c: 'str'
      };

      if (Test.c === 'str') {
        return 0;
      }

      return 1;
    }

    `
  );

  t.pass();
});
