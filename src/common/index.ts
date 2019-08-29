import crypto from 'crypto';
import llvm from 'llvm-node';

export function genTypesHash(types: llvm.Type[]): string {
  return digestToHex(types.map(t => t.typeID).join('-'));
}

export function genStructHash(t: llvm.Type): string {
  const realType = findRealType(t);
  if (!realType.isStructTy()) {
    throw new Error('The generated struct hash must be a struct.');
  }

  const types = [];

  for (let i = 0; i < realType.numElements; i++) {
    types.push(realType.getElementType(i));
  }

  return genTypesHash(types);
}

export function findRealType(t: llvm.Type): llvm.Type {
  if (t.isPointerTy()) {
    return findRealType(t.elementType);
  }

  return t;
}

function digestToHex(buf: Buffer | string): string {
  return crypto
    .createHash('md5')
    .update(buf)
    .digest()
    .toString('hex');
}
