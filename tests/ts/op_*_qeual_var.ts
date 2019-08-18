// *=, /=, %=, +=, -=, <<=, >>=, >>>=, &=, ^=, |=
function main(): number {
  let a: number = 1024;
  a *= 2;
  a /= 2;
  a %= 2;
  a += 2;
  a -= 2;
  a <<= 2;
  a >>= 2;
  a >>>= 2;
  a &= 2;
  a *= 2;
  a |= 2;
  return a;
}
