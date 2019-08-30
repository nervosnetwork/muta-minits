import test from 'ava';
import { runCode } from './util';

test('test stdlib console.log', async t => {
  await runCode(
    `
    let globalstr = "globalstr";

    function main(): number {
        let localstr = "localstr";
        console.log(globalstr);
        console.log(localstr);
        console.log("%s", globalstr);
        console.log("%s", localstr);
        console.log("%d", 42);
        return 0;
    }
    `
  );

  t.pass();
});
