import { runTest } from './util';

const srcSizedArray = `
function echo(a: number): number {
    let array = [a, 0, 0, 1];
    return array[0];
}

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
    let b = [1, 2, echo(3)];
    if (b[2] != 3) {
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
`;

const srcString = `
let globalarr: string[] = ["10", "20"];

function main(): number {
    let localarr: string[] = ["10", "20"];
    if (globalarr[0] !== localarr[0]) {
        return 1;
    }
    if (globalarr[1] !== localarr[1]) {
        return 1;
    }
    return 0;
}
`;

const srcAsArgument = `
function echo(n: number[]): number {
    return n[0]
}

function main(): number {
    let l = [0x10, 0x11, 0x12];
    return echo(l);
}
`;

runTest('test array: sized', srcSizedArray);
runTest('test array: string', srcString);
runTest('test array: as argument', srcAsArgument);
