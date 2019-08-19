import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './codegen';
import { genArrayType } from './codegen-array';

export function genVariableDeclaration(
  cgen: LLVMCodeGen,
  node: ts.VariableDeclaration
): llvm.Value {
  if (cgen.symtab.depths() === 0) {
    return genVariableDeclarationGlobal(cgen, node);
  } else {
    return genVariableDeclarationLocale(cgen, node);
  }
}

function genVariableDeclarationLocale(
  cgen: LLVMCodeGen,
  node: ts.VariableDeclaration
): llvm.Value {
  const name = node.name.getText();
  cgen.currentType = node.type;
  const initializer = cgen.genExpression(node.initializer!);
  const type = initializer.type;

  if (type.isPointerTy()) {
    const real = type as llvm.PointerType;
    if (real.elementType.isArrayTy()) {
      cgen.symtab.set(name, initializer);
      return initializer;
    }
    throw new Error('Unsupported pointer type');
  } else {
    const alloca = cgen.builder.createAlloca(type, undefined, name);
    cgen.builder.createStore(initializer, alloca);
    cgen.symtab.set(name, alloca);
    return alloca;
  }
}

function genVariableDeclarationGlobal(
  cgen: LLVMCodeGen,
  node: ts.VariableDeclaration
): llvm.Value {
  const name = node.name.getText();
  cgen.currentType = node.type;
  switch (node.initializer!.kind) {
    case ts.SyntaxKind.NumericLiteral:
      return genVariableDeclarationGlobalNumeric(
        cgen,
        node.initializer! as ts.NumericLiteral,
        name
      );
    case ts.SyntaxKind.ArrayLiteralExpression:
      return genVariableDeclarationGlobalArrayLiteral(
        cgen,
        node.initializer! as ts.ArrayLiteralExpression,
        name
      );
    default:
      throw new Error('Unsupported type');
  }
}

function genVariableDeclarationGlobalNumeric(
  cgen: LLVMCodeGen,
  node: ts.NumericLiteral,
  name: string
): llvm.GlobalVariable {
  const initializer = cgen.genNumeric(node);
  const type = initializer.type;
  const r = new llvm.GlobalVariable(
    cgen.module,
    type,
    false,
    llvm.LinkageTypes.ExternalLinkage,
    initializer,
    name
  );
  cgen.symtab.set(name, r);
  return r;
}

function genVariableDeclarationGlobalArrayLiteral(
  cgen: LLVMCodeGen,
  node: ts.ArrayLiteralExpression,
  name: string
): llvm.GlobalVariable {
  const arrayType = genArrayType(cgen, node);
  const arrayData = llvm.ConstantArray.get(
    arrayType,
    node.elements.map(item => {
      return cgen.genExpression(item) as llvm.Constant;
    })
  );
  const r = new llvm.GlobalVariable(
    cgen.module,
    arrayType,
    false,
    llvm.LinkageTypes.ExternalLinkage,
    arrayData,
    name
  );
  cgen.symtab.set(name, r);
  return r;
}
