function mut(obj: { num: number; str: string }): { num: number; str: string } {
  obj.num = 100;
  obj.str = 'hello world';
  return obj;
}

function main(): number {
  let testObj = {
    num: 10,
    str: '123'
  };

  let mutObj = mut(testObj);
  if (mutObj.str !== 'hello world') {
    return 1;
  }

  if (mutObj.num !== 100) {
    return 1;
  }

  return mutObj.num;
}
