function echo(n: number): number {
    return n;
}

function main(): number {
    let a = echo(42);
    let n = 42;
    let b = echo(n);
    return a + b; // 84
}
