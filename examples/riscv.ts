// A simple example for riscv machine
//
// $ ts-node src/index.ts build examples/riscv.ts -o /tmp/riscv.ll --triple riscv64-unknown-unknown-elf
// $ llvm-as src/stdlib/syscall.ll -o /tmp/syscall.bc
// $ llvm-as /tmp/riscv.ll -o /tmp/riscv.bc
// $ llvm-link /tmp/syscall.bc /tmp/riscv.bc -o /tmp/main.bc
// $ llc -filetype=obj /tmp/main.bc -o /tmp/main.obj
// $ riscv64-unknown-elf-gcc /tmp/main.obj -o /tmp/main.out

function syscall(n: number, a: any, b: any, c: any, d: any, e: any, f: any): number {
    return 0;
}

function main(): number {
    let a = "Hello World!";
    return syscall(2177, a, 0, 0, 0, 0, 0);
}
