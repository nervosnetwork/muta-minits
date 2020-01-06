// use ts-node to run the file directly for devlopment and test.
// ts-node examples/brainfuck_class/test.ts
import { BrainfuckInterpreter } from './brainfuck';

BrainfuckInterpreter.prototype.putchar = (n: number) => {
    process.stdout.write(String.fromCharCode(n));
}
let code = '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.';
console.log(`code: ${code}`);
console.log('\n---------- start ----------');
let bfi = new BrainfuckInterpreter(code);
let status_code = bfi.run();
console.log('----------  end  ----------\n');
console.log(`status_code: ${status_code}`);
