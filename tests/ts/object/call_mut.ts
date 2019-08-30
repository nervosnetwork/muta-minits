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
