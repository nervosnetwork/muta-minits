import test from 'ava';
import { runCode } from './util';

const srcIf = `
function main(): number {
  let a = 2;
  let r = 0;
  if (a === 0) {
    r = 0;
  } else if (a === 1) {
    r = 1;
  } else {
    r = 2;
  }
  return r;
}
`;

test('test if', async t => {
  if (await runCode(srcIf)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcIfContainsFor = `
function main(): number {
  let s = 0;
  if (true) {
    for (let j = 0; j < 10; j++) {
      s += 1;
    }
  }
  return s;
}
`;

test('test if contains for', async t => {
  if (await runCode(srcIfContainsFor)) {
    t.pass();
  } else {
    t.fail();
  }
});
