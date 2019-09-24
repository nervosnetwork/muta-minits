import test from 'ava';
import { runCode } from './util';

const srcNumber = `
function main(): number {
    return 2 > 1? 20 : 10;
}
`;

const srcString = `
function main(): number {
  let a = 2 > 1? "Hello": "World";
  if (a !== "Hello") {
    return 1;
  }
  return 0;
}
`;

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

test('test condition number', async t => {
  await runCode(srcNumber);
  t.pass();
});

test('test condition string', async t => {
  await runCode(srcString);
  t.pass();
});

test('test condition if contains for', async t => {
  await runCode(srcIfContainsFor);
  t.pass();
});
