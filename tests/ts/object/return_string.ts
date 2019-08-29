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
