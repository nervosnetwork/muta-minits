import { runTest } from './util';

const srcNumber = `
function main(): number {
    return 2 > 1? 20 : 10;
}
`;

const srcString = `
function main(): number {
  let a = 2 > 1? "Hello": "World";
  if (a !== "Hello") {
    return 1;
  }
  return 0;
}
`;

runTest('test condition: number', srcNumber);
runTest('test condition: string', srcString);
