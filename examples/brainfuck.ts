// Inspired by this project: https://github.com/mohanson/brainfuck

const enum Opcode {
    SHR = '>',
    SHL = '<',
    ADD = '+',
    SUB = '-',
    PUTCHAR = '.',
    GETCHAR = ',',
    LB = '[',
    RB = ']',
}

function uint8(n: number): number {
    if (n > 256) {
        return uint8(n - 256);
    }
    if (n < 0) {
        return uint8(n + 256);
    }
    return n
}

function main(argc: number, argv: string[]): number {
    if (argc !== 2) {
        return 1;
    }
    let src = argv[1];
    let pc = 0;
    let ps = 0;
    let stack = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (; pc < strlen(argv[1]) ;) {
        let op = src[pc];
        if (op === Opcode.SHR) {
            ps += 1;
        }
        if (op === Opcode.SHL) {
            ps -= 1;
        }
        if (op === Opcode.ADD) {
            stack[ps] = uint8(stack[ps] + 1);
        }
        if (op === Opcode.SUB) {
            stack[ps] = uint8(stack[ps] - 1);
        }
        if (op === Opcode.PUTCHAR) {
            console.log('%s', stack[ps]);
        }
        if (op === Opcode.GETCHAR) {
            console.log('GETCHAR is disabled');
            return 1;
        }
        if (op === Opcode.LB) {
            if (stack[ps] != 0x00) {
                continue
            }
            let n = 1;
            for (; n !== 0 ;) {
                pc += 1;
                if (src[pc] === Opcode.LB) {
                    n += 1;
                    continue
                }
                if (src[pc] === Opcode.RB) {
                    n -= 1;
                    continue
                }
            }
            continue
        }
        if (op === Opcode.RB) {
            if (stack[ps] !== 0x00) {
                continue
            }
            let n = 1;
            for (; n !== 0;) {
                pc -= 1;
                if (src[pc] === Opcode.RB) {
                    n += 1;
                    continue
                }
                if (src[pc] === Opcode.LB) {
                    n -= 1;
                    continue
                }
            }
            continue
        }

        pc += 1;
    }
    return 0;
}
