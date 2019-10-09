import { runTest } from './util';

const srcObjectCallMut = `
function mut(obj: { num: number; str: string }): void {
  obj.num = 100;
  obj.str = 'hello world';
  return;
}

function main(): number {
  let testObj = {
    num: 10,
    str: '123'
  };

  mut(testObj);
  if (testObj.str !== 'hello world') {
    return 1;
  }
  return testObj.num;
}
`;

const srcObjectReturnNumber = `
const Test = {
  a: 1,
  d: 12
};

function main(): number {
  const Test = {
    a: 1,
    c: 10
  };

  return Test.c;
}
`;

const srcObjectReturnString = `
const Test = {
  a: 1
};

function main(): number {
  const Test = {
    a: 1,
    c: 'str'
  };

  if (Test.c === 'str') {
    return 0;
  }

  return 1;
}
`;

const srcInitWithVariable = `
function main(): number {
  let n = 10;
  let a = {a: n};
  return a.a
}
`;

const srcObjectDuckType = `
function echo(num: { num: number }): number {
  return num.num;
}

function main(): number {
  const val0 = echo({ num: 10 );
  if (val0 !== 10) {
    return 1;
  }

  const obj1 = { num: 11, str: '12' };
  const val1 = echo(obj1);
  if (val1 !== 11) {
    return 1;
  }

  const obj2 = { num: 12, str: '12', b: true };
  const val2 = echo(obj2);
  if (val2 !== 12) {
    return 1;
  }

  return 0;
}
`;

const srcObjectDuckTypeMut = `
function echo(num: { num: number }): number {
  num.num = 20;
  return num.num;
}

function main(): number {
  const obj1 = { num: 11, str: '12' };
  echo(obj1);
  return obj1.num;
}
`;

runTest('test object: call mut', srcObjectCallMut);
runTest('test object: return number', srcObjectReturnNumber);
runTest('test object: return string', srcObjectReturnString);
runTest('test object: init with variable', srcInitWithVariable);
runTest('test object: duck type', srcObjectDuckType);
runTest('test object: duck type mut', srcObjectDuckTypeMut);
