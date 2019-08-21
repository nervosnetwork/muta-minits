function main(): number {
    let s = 0;

    // for (let i = 0; i < 10; i++) {
    //     if (i === 5) {
    //         continue
    //     }
    //     s++;
    // } // s === 9

    // let i = 0;
    // while (i < 10) {
    //     i++;
    //     if (i === 5) {
    //         continue
    //     }
    //     s++;
    // } // s === 18

    let a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    for (let v of a) {
        if (v === 5) {
            continue
        }
        s++;
    } // s === 27

    return s;
}
