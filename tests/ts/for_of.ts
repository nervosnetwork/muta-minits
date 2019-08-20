let globalarr = [1, 2, 3];

function main(): number {
    let localearr = [4, 5, 6];
    let s: number = 0;
    for (let v of globalarr) {
        s += v;
    }
    for (let v of localearr) {
        s += v;
    }
    return s; // 21
}
