// *=, /=, %=, +=, -=, <<=, >>=, >>>=, &=, ^=, |=
function main(): number {
  let a: number = 1024;
  let b: number = 2;
  a *= b;
  a /= b;
  a %= b;
  a += b;
  a -= b;
  a <<= b;
  a >>= b;
  a >>>= b;
  a &= b;
  a *= b;
  a |= b;
  return a;
}
