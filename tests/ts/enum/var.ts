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
