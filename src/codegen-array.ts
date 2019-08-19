import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './codegen';

export function genArrayType(
  cgen: LLVMCodeGen,
  node: ts.ArrayLiteralExpression
): llvm.ArrayType {
  const length = node.elements.length;
  const elementType = (() => {
    if (length === 0) {
      return cgen.genType((cgen.currentType! as ts.ArrayTypeNode).elementType);
    } else {
      return cgen.genExpression(node.elements[0]).type;
    }
  })();
  return llvm.ArrayType.get(elementType, length);
}

export function genArrayInitializer(
  cgen: LLVMCodeGen,
  node: ts.ArrayLiteralExpression
): llvm.Value[] {
  return node.elements.map(item => {
    return cgen.genExpression(item);
  });
}

// [0] https://stackoverflow.com/questions/38548680/confused-about-llvm-arrays
// [1] https://stackoverflow.com/questions/33003928/allow-llvm-generate-code-to-access-a-global-array
export function genArrayLiteral(
  cgen: LLVMCodeGen,
  node: ts.ArrayLiteralExpression
): llvm.AllocaInst {
  const arrayType = genArrayType(cgen, node);
  const arraySize = llvm.ConstantInt.get(
    cgen.context,
    arrayType.numElements,
    64
  );
  const arrayPtr = cgen.builder.createAlloca(arrayType, arraySize);
  genArrayInitializer(cgen, node).forEach((item, i) => {
    const ptr = cgen.builder.createInBoundsGEP(arrayPtr, [
      llvm.ConstantInt.get(cgen.context, 0, 64),
      llvm.ConstantInt.get(cgen.context, i, 64)
    ]);
    cgen.builder.createStore(item, ptr);
  });
  return arrayPtr;
}

export function genArrayElementAccess(
  cgen: LLVMCodeGen,
  node: ts.ElementAccessExpression
): llvm.Value {
  const identifier = cgen.genExpression(node.expression);
  const argumentExpression = cgen.genExpression(node.argumentExpression);
  const ptr = cgen.builder.createInBoundsGEP(identifier, [
    llvm.ConstantInt.get(cgen.context, 0, 64),
    argumentExpression
  ]);
  return cgen.builder.createLoad(ptr);
}
