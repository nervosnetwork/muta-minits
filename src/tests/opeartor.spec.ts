import test from 'ava';
import { runCode } from './util';

test('test operator arithmetic operations', async t => {
  await runCode(
    `
    function main(): number {
        let n: number = 0;
        n = n + 10; // 10
        n = n - 2;  // 8
        n = n * 2;  // 16
        n = n / 4;  // 4
        n = n * 10; // 40
        n = n % 17; // 6
        return n;
    }
    `
  );

  t.pass();
});

test('test operator bits', async t => {
  await runCode(
    `const Test = {
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

test('test operator compare', async t => {
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

test('test operator compound assignment const', async t => {
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

test('test operator compound assignment var', async t => {
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

test('test operator number', async t => {
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

test('test operator paren', async t => {
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

test('test operator postfix unary', async t => {
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
