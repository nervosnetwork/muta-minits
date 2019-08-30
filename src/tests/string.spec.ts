import test from 'ava';
import { runCode } from './util';

test('test string elem', async t => {
  await runCode(
    `
    function main(): number {
        let s = "Hello";
        if (s[0] !== "H") {
            return 1;
        }
        if (s[1] !== "e") {
            return 1;
        }
        if (s[4] !== "o") {
            return 1;
        }
        return 0;
    }
    `
  );

  t.pass();
});
