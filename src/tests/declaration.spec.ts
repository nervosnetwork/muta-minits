import test from 'ava';
import { runCode } from './util';

test('test declaration global var', async t => {
  await runCode(
    `
    let a: number = 1;
    let b: number[] = [2, 3];

    function main(): number {
        let c = 4;
        return a + b[0] + c;
    }
    `
  );

  t.pass();
});

test('test declaration type inference', async t => {
  await runCode(
    `
    function main(): number {
        let a = 10; // Skip the annotation type
        let b: number = 20;
        return a + b;
    }
    `
  );

  t.pass();
});
