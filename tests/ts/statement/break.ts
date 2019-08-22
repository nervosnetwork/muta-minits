function main(): number {
    let s = 0;

    for (let i = 0; i < 10; i++) {
        s += i;
        if (i == 5) {
            break;
        }
    } // s == 15

    while (true) {
        s++;
        if (s == 20) {
            break;
        }
    } // s == 20


    return s;
}
