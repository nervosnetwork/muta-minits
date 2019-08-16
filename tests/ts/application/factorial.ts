// In mathematics, the factorial of a positive integer n, denoted by n!, is the product of all positive integers less
// than or equal to n
//
// F(n) = n × (n − 1) × (n − 2) . . . × 3 × 2 × 1
function factorial(n: number): number {
    let s: number = 0;
    for (let i: number = 0; i < n; i++) {
        s = s + i;
    }
    return s;
}

function main(): number {
    return factorial(5); // 120
}
