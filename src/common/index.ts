import crypto from 'crypto';
import llvm from 'llvm-node';
import ts from 'typescript';

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

export function buildStructMaps(
  struct: llvm.StructType,
  node: ts.ObjectLiteralExpression | ts.TypeLiteralNode
): Map<string, number> {
  let fieldNames: string[] = [];

  if (ts.isObjectLiteralExpression(node)) {
    fieldNames = node.properties.map(p => (p.name as ts.Identifier).getText());
  } else if (ts.isTypeLiteralNode(node)) {
    fieldNames = node.members.map(m => m.name!.getText());
  } else {
    throw new Error(`Kind not supported.`);
  }

  const fields: Map<string, number> = new Map();
  Array.from({ length: (findRealType(struct) as llvm.StructType).numElements }).forEach((_, index) =>
    fields.set(fieldNames[index], index)
  );

  return fields;
}

export function trimQuotes(s: string): string {
  return s.replace(/^[\"|\']|[\"|\']$/g, '');
}

export function completionSuffix(s: string): string {
  return s.endsWith('.ts') ? s : s + '.ts';
}

function digestToHex(buf: Buffer | string): string {
  return crypto
    .createHash('md5')
    .update(buf)
    .digest()
    .toString('hex');
}
