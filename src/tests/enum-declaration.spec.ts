import { runTest } from './util';

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

const srcEnumReturn = `
enum Test {
  a,
  b
}

function main(): Test {
  return Test.a;
}
`;

const srcEnumVar = `
enum Test {
  a,
  b
}

function runTest(t: Test): number {
  return t;
}

function main(): number {
  return runTest(Test.b);
}
`;

const srcEnumPlus = `
enum Test {
  a = 100,
  b = 101
}

function runTest(n: number): number {
  return n;
}

function main(): number {
  runTest(1 + Test.a);
  return runTest(Test.b + 1);
}
`;

runTest('test enum: initializer', srcEnumInitializer);
runTest('test enum: iota', srcEnumIota);
runTest('test enum: as return value', srcEnumReturn);
runTest('test enum: var', srcEnumVar);
runTest('test enum: plus', srcEnumPlus);
