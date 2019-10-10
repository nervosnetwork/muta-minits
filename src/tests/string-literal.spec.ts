import { runTest } from './util';

const srcStringElem = `
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
`;

const srcStringLength = `
function main(): number {
  let s = "Hello";
  return s.length
}
`;

const srcStringConcat = `
function main(): number {
  let a = "Hello";
  let b = "World";
  let c = a + " " + b;
  return c.length
}
`;

runTest('test string: elem', srcStringElem);
runTest('test string: length', srcStringLength);
runTest('test string: concat', srcStringConcat);
