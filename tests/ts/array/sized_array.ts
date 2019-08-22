function main(): number {
    let a: number[] = [1, 2, 3];
    // Get
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
    // Set
    s = 0;
    a[0] = 4;
    a[1] = 5;
    a[2] = 6;
    for (let j = 0; j < 3; j++) {
        s += a[j];
    }
    if (s !== 15) {
        return 1;
    }
    return 0;
}
