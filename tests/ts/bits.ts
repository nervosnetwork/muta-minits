function main(): number {
    let a: number = 0xf0;
    a = a & 0x70; // 0x70
    a = a | 0x0f; // 0x7f
    a = ~a; // 0x80;
    return a;
}
