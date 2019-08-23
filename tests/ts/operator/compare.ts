function main(): number {
    let s: number = 0;
    let a: number = 0;

    a = 2;
    if (a > 1) {
        s = s + 1;
    }

    a = 1;
    if (a < 2) {
        s = s + 1;
    }

    a = 1;
    if (a >= 1) {
        s = s + 1;
    }

    a = 1;
    if (a <= 1) {
        s = s + 1;
    }

    a = 1;
    if (a == 1) {
        s = s + 1;
    }

    a = 2;
    if (a != 1) {
        s = s + 1;
    }

    if (s == 6) {
        return 0;
    }
    return 1;
}
