import { runTest } from './util';

const srcFunctionCall = `
function echo(n: number): number {
    return n;
}

function main(): number {
    let a = echo(42);
    let n = 42;
    let b = echo(n);
    return a + b; // 84
}
`;

const srcFunctionReturnZero = `
function main(): number {
    return 0;
}
`;

const srcFunctionReturnOne = `
function main(): number {
    return 1;
}
`;

const srcFunctionIgnoreReturn = `
function echo() {
  console.log("Hello World!");
}

function main(): number {
  echo();
  return 0;
}
`;

const srcFunctionOrder = `
function main(): number {
  funcA();
  return 0;
}

function funcD() {
  funcC();
}

function funcC() {}

function funcB() {
  funcD();
}

function funcA() {
  funcD();
}
`;

runTest('test function: call', srcFunctionCall);
runTest('test function: return 0', srcFunctionReturnZero);
runTest('test function: return 1', srcFunctionReturnOne);
runTest('test function: ignore return', srcFunctionIgnoreReturn);
runTest('test function: order', srcFunctionOrder);
