import test from 'ava';
import { runCode } from './util';

const srcSwitchCaseDefault = `
function main(): number {
    let a = 2;
    let r = 0;

    switch (a) {
        case 0:
        r = 0;
        case 1:
        r = 1;
        case 2:
        r = 2;
        default:
        r = 3;
    }

    return r;
}
`;

test('test switch case default', async t => {
  await runCode(srcSwitchCaseDefault);
  t.pass();
});
