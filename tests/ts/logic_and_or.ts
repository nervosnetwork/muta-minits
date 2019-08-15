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
