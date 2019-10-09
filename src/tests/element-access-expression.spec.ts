import { runTest } from './util';

const srcNumber = `
let globalarr = [1, 2, 3];

function main(): number {
    let localearr = [4, 5, 6];
    let s: number = 0;
    s += globalarr[0];
    s += localearr[0];
    s += [1, 2, 3][0];
    return s; // 6
}
`;

const srcString = `
let globalstr = "Hello";

function main(): number {
  let localestr = "Hello";
  if (globalstr[0] !== "H") {
    return 1;
  }
  if (localestr[0] !== "H") {
    return 1;
  }
  if ("Hello"[0] !== "H") {
    return 1;
  }
  return 0;
}
`;

runTest('test element: access number', srcNumber);
runTest('test element: access string', srcString);
