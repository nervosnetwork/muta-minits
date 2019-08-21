function main(): number {
    let a = 1 + 2 * 3;              // a === 7
    let b = (1 + 2) * 3             // b === 9
    let c = 2 * (4 + ((1 + 2) * 3)) // c === 26
    return a + b + c;               // 42
}
