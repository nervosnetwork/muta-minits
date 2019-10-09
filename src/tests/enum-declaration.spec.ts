import test from 'ava';
import { runCode } from './util';

const srcEnumInitializer = `
enum Test {
  a = 100,
  b = 101,
  c = 102
}

function main(): number {
  return Test.a;
}
`;

test('test enum initializer', async t => {
  if (await runCode(srcEnumInitializer)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcEnumIota = `
enum Test {
  a = 100,
  b,
  c = 103
}

function main(): number {
  return Test.b;
}
`;

test('test enum iota', async t => {
  if (await runCode(srcEnumIota)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcEnumReturn = `
enum Test {
  a,
  b
}

function main(): Test {
  return Test.a;
}
`;

test('test enum return', async t => {
  if (await runCode(srcEnumReturn)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcEnumVar = `
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
`;

test('test enum var', async t => {
  if (await runCode(srcEnumVar)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcEnumPlus = `
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
`;

test('test enum plus', async t => {
  if (await runCode(srcEnumPlus)) {
    t.pass();
  } else {
    t.fail();
  }
});
