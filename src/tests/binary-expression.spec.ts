import test from 'ava';
import { runCode } from './util';

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

test('test operator arithmetic operations', async t => {
  if (await runCode(srcOperatorArithmeticOperations)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator bits', async t => {
  if (await runCode(srcOperatorBits)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator compare', async t => {
  if (await runCode(srcOperatorCompare)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator compound assignment const', async t => {
  if (await runCode(srcOperatorCompoundAssignmentConst)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator compound assignment var', async t => {
  if (await runCode(srcoOperatorCompoundAssignmentVar)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator number', async t => {
  if (await runCode(srcOperatorNumber)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator paren', async t => {
  if (await runCode(srcOperatorParen)) {
    t.pass();
  } else {
    t.fail();
  }
});

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

test('test operator postfix unary', async t => {
  if (await runCode(srcOperatorPostfixUnary)) {
    t.pass();
  } else {
    t.fail();
  }
});
