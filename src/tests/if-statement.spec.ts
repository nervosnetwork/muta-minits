import { runTest } from './util';

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

runTest('test if: smoke', srcIf);
runTest('test if: contains for', srcIfContainsFor);
