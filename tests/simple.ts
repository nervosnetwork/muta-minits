// main.ts
function fibo(n: number): number {
  if (n < 2) {
    return n;
  }
  return fibo(n - 1) + fibo(n - 2);
}

function main(): number {
  console.log('%d', fibo(10));
  return 0;
}
