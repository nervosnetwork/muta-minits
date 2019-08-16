// In mathematics, the factorial of a positive integer n, denoted by n!, is the product of all positive integers less
// than or equal to n
//
// F(n) = n × (n − 1) × (n − 2) . . . × 3 × 2 × 1
function factorial(n: number): number {
    let s: number = 1;
    for (let i: number = 1; i <= n; i++) {
        s = s * i;
    }
    return s;
}

function main(): number {
    return factorial(5); // 120
}
