function main(): number {
    let a: number[] = [1, 2, 3];
    if (a[2] !== 3) {
        return 1;
    }
    let i = 2;
    if (a[i] !== 3) {
        return 1;
    }
    let s = 0;
    for (let j = 0; j < 3; j++) {
        s += a[j];
    }
    if (s !== 6) {
        return 1;
    }
    return 0;
}
