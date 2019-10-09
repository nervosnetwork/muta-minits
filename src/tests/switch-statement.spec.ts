import test from 'ava';
import { runCode } from './util';

const srcSwitchCaseDefault = `
function main(): number {
  let a = 2;
  let r = 0;

  switch (a) {
    case 0:
      r = 0;
      break;
    case 1:
      r = 1;
      break;
    case 2:
      r = 2;
      break;
    default:
      r = 3;
      break;
  }

  return r;
}
`;

test('test switch case default', async t => {
  if (await runCode(srcSwitchCaseDefault)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcSwitchString = `
function main(): number {
  let a = "B";
  let r = 0;

  switch (a) {
    case "A":
      r = 0;
      break;
    case "B":
      r = 1;
      break;
    case "C":
      r = 2;
      break;
    default:
      r = 3;
      break;
  }

  return r;
}
`;

test('test switch string', async t => {
  if (await runCode(srcSwitchString)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcNoDefault = `
function main(): number {
  let a = 2;
  let r = 0;

  switch (a) {
    case 0:
      r = 0;
      break;
    case 1:
      r = 1;
      break;
    case 2:
      r = 2;
      break;
  }

  return r;
}
`;

test('test switch no default', async t => {
  if (await runCode(srcNoDefault)) {
    t.pass();
  } else {
    t.fail();
  }
});
