// $ node build/main/index.js build examples/brainfuck_class/brainfuck.ts -o brainfuck.ll
// $ clang brainfuck.ll -o brainfuck
//
// $ ./brainfuck "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>."

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

export class BrainfuckInterpreter {
    code: string;
    pc: number;
    ps: number;

    constructor(code: string) {
        this.code = code;
        this.pc = 0;
        this.ps = 0;
    }

    reset() {
        this.pc = 0;
        this.ps = 0;
    }

    uint8(n: number): number {
        if (n > 0xff) {
            return this.uint8(n - 256);
        }
        if (n < 0x00) {
            return this.uint8(n + 256);
        }
        return n
    }

    run(): number {
        this.reset();
        let stack = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ];
        // run
        for (; this.pc < this.code.length;) {
            let op = this.code[this.pc];
            if (op === Opcode.SHR) {
                this.ps += 1;
                this.pc += 1;
                continue
            }
            if (op === Opcode.SHL) {
                this.ps -= 1;
                this.pc += 1;
                continue
            }
            if (op === Opcode.ADD) {
                stack[this.ps] = this.uint8(stack[this.ps] + 1);
                this.pc += 1;
                continue
            }
            if (op === Opcode.SUB) {
                stack[this.ps] = this.uint8(stack[this.ps] - 1);
                this.pc += 1;
                continue
            }
            if (op === Opcode.PUTCHAR) {
                this.putchar(stack[this.ps]);
                this.pc += 1;
                continue
            }
            if (op === Opcode.GETCHAR) {
                console.log('GETCHAR is disabled');
                return 1;
            }


            if (op === Opcode.LB) {
                if (stack[this.ps] != 0x00) {
                    this.pc += 1;
                    continue
                }
                let n = 1;
                for (; n !== 0;) {
                    this.pc += 1;
                    if (this.code[this.pc] === Opcode.LB) {
                        n += 1;
                        continue
                    }
                    if (this.code[this.pc] === Opcode.RB) {
                        n -= 1;
                        continue
                    }
                }
                this.pc += 1;
                continue
            }
            if (op === Opcode.RB) {
                if (stack[this.ps] === 0x00) {
                    this.pc += 1;
                    continue
                }
                let n = 1;
                for (; n !== 0;) {
                    this.pc -= 1;
                    if (this.code[this.pc] === Opcode.RB) {
                        n += 1;
                        continue
                    }
                    if (this.code[this.pc] === Opcode.LB) {
                        n -= 1;
                        continue
                    }
                }
                this.pc += 1;
                continue
            }
        }
        return 0;
    }

    putchar(n: number) {
        console.log('%c', n);
    }
}

export function main(argc: number, argv: string[]): number {
    if (argc !== 2) {
        return 1;
    }
    let bfi = new BrainfuckInterpreter(argv[1]);
    let status_code = bfi.run();
    return status_code;
}
