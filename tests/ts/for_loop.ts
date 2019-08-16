function main(): number {
    let s: number = 0;

    for (let i: number = 0; i < 5; i++) {
        s = s + i;
    } // s === 10

    let j: number = 0;
    for (; j < 5; j++) {
        s = s + j;
    } // s === 20

    let k: number = 0;
    for (; k < 5;) {
        s = s + k;
        k++;
    } // s === 30

    return s;
}
