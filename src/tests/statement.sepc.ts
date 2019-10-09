import test from 'ava';
import { runCode } from './util';

const srcStatementBreak = `
function main(): number {
    let s = 0;

    for (let i = 0; i < 10; i++) {
        s += i;
        if (i == 5) {
            break;
        }
    } // s == 15

    while (true) {
        s++;
        if (s == 20) {
            break;
        }
    } // s == 20


    return s;
}
`;

test('test statement break', async t => {
  if (await runCode(srcStatementBreak)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcStatementContinue = `
function main(): number {
    let s = 0;

    for (let i = 0; i < 10; i++) {
        if (i === 5) {
            continue
        }
        s++;
    } // s === 9

    let i = 0;
    while (i < 10) {
        i++;
        if (i === 5) {
            continue
        }
        s++;
    } // s === 18

    let a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    for (let v of a) {
        if (v === 5) {
            continue
        }
        s++;
    } // s === 27

    return s;
}
`;

test('test statement continue', async t => {
  if (await runCode(srcStatementContinue)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcStatementDo = `
function main(): number {
    let s = 0;
    let i = 0;
    do {
        s += i;
        i += 1;
    } while (i <= 10)
    return s; // 55
}
`;

test('test statement do', async t => {
  if (await runCode(srcStatementDo)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcStatementForLoop = `
function main(): number {
    let s: number = 0;

    for (let i: number = 0; i < 5; i++) {
        s = s + i;
    } // s === 10

    let j: number = 0;
    for (; j < 5; j++) {
        s = s + j;
    } // s === 20

    let k: number = 0;
    for (; k < 5;) {
        s = s + k;
        k++;
    } // s === 30

    return s;
}
`;

test('test statement for loop', async t => {
  if (await runCode(srcStatementForLoop)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcStatementLogicAndOr = `
function main(): number {
    let a: boolean = false;

    a = false && false;
    if (a !== false) {
        return 1;
    }
    a = false && true;
    if (a !== false) {
        return 2;
    }
    a = true && false;
    if (a !== false) {
        return 3;
    }
    a = true && true;
    if (a !== true) {
        return 4;
    }

    a = false || false;
    if (a !== false) {
        return 5;
    }
    a = false || true;
    if (a !== true) {
        return 6;
    }
    a = true || false;
    if (a !== true) {
        return 7;
    }
    a = true || true;
    if (a !== true) {
        return 8;
    }

    return 0;
}
`;

test('test statement logic and or', async t => {
  if (await runCode(srcStatementLogicAndOr)) {
    t.pass();
  } else {
    t.fail();
  }
});

const srcStatementWhile = `
function main(): number {
    let s = 0;
    while (s != 10) {
        s++;
    }
    return s; // 20
}
`;

test('test statement while', async t => {
  if (await runCode(srcStatementWhile)) {
    t.pass();
  } else {
    t.fail();
  }
});
