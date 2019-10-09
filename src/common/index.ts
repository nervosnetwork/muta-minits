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

export function digestToHex(buf: Buffer | string): string {
  return crypto
    .createHash('md5')
    .update(buf)
    .digest()
    .toString('hex');
}

// Generate a function hash based on the function and the actual parameters passed.
// This is designed for the duck type when a function is called.
//
// eg.
// function echo(num: { num: number }): number {
//   return num.num;
// }
//
// function main(): number {
//   echo({ num: 10 }); // ok
//
//   const obj1 = { num: 11, str: '12' };
//   echo(obj1); // ok
//
//   const obj2 = { num: 12, str: '12', b: true };
//   echo(obj2); // ok
//
//   return 1;
// }
//
// Because each object type passed is inconsistent,
// the LLVM IR layer generates a different function signature for each
// call to echo, and the function hsah is the echo function to determine whether
// the same parameters exist, so as to avoid repeated generation.
//
// TODO: Some boundaries are not handled, such as is it a reference to a reference?
export function genFunctionHashWithCall(checker: ts.TypeChecker, call: ts.CallExpression): string {
  const funcDecl = checker.getResolvedSignature(call)!.getDeclaration() as ts.FunctionDeclaration;

  const code = funcDecl.getText();
  const args = call.arguments;
  const retType = funcDecl.type ? funcDecl.type : ts.createVoidZero();
  let hasTypeLiteral: boolean = false;

  const argStr = funcDecl.parameters
    .map((param, index) => {
      if (ts.isTypeLiteralNode(param.type!)) {
        hasTypeLiteral = true;
        const arg = args[index];
        if (ts.isIdentifier(arg)) {
          const sym = checker.getSymbolAtLocation(arg)!;
          const varObj = sym.valueDeclaration as ts.VariableDeclaration;
          return (varObj.initializer! as ts.ObjectLiteralExpression).properties.map(p => p.kind).join('-');
        } else if (ts.isObjectLiteralExpression(arg)) {
          return arg.properties.map(p => p.kind).join('-');
        }
      }
      return param.type!.kind + '';
    })
    .join('-');

  const retStr = ts.isVoidExpression(retType) ? 'void' : retType.getText();

  if (hasTypeLiteral) {
    return digestToHex([code, argStr, retStr].join('-'));
  } else {
    return (call.expression as ts.Identifier).getText();
  }
}
