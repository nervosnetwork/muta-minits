import test from 'ava';
import { runCode } from './util';

const srcGlobalVar = `
let a: number = 1;
let b: number[] = [2, 3];

function main(): number {
    let c = 4;
    return a + b[0] + c;
}
`;

test('test declaration global var', async t => {
  if (await runCode(srcGlobalVar)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcTypeInference = `
function main(): number {
    let a = 10; // Skip the annotation type
    let b: number = 20;
    return a + b;
}
`;

test('test declaration type inference', async t => {
  if (await runCode(srcTypeInference)) {
    t.pass();
  } else {
    t.fail();
  }
});
