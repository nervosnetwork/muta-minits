import { runTest } from './util';

const srcOperatorArithmeticOperations = `
function main(): number {
    let n: number = 0;
    n = n + 10; // 10
    n = n - 2;  // 8
    n = n * 2;  // 16
    n = n / 4;  // 4
    n = n * 10; // 40
    n = n % 17; // 6
    return n;
}
`;

const srcOperatorBits = `
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

const srcOperatorCompare = `
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

const srcOperatorCompoundAssignmentConst = `
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

const srcoOperatorCompoundAssignmentVar = `
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

const srcOperatorNumber = `
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

const srcOperatorParen = `
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

const srcOperatorPostfixUnary = `
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

runTest('test binary: arithmetic operations', srcOperatorArithmeticOperations);
runTest('test binary: bits', srcOperatorBits);
runTest('test binary: compare', srcOperatorCompare);
runTest('test binary: compound assignment const', srcOperatorCompoundAssignmentConst);
runTest('test binary: compound assignment var', srcoOperatorCompoundAssignmentVar);
runTest('test binary: number', srcOperatorNumber);
runTest('test binary: paren', srcOperatorParen);
runTest('test binary: postfix unary', srcOperatorPostfixUnary);
