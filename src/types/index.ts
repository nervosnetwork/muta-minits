import llvm from 'llvm-node';
import ts from 'typescript';

export enum StructMetaType {
  Class,
  Enum
}

export interface StructMeta {
  metaType: StructMetaType;
  typeHash?: string;
  struct: llvm.StructType;
}

export enum DepType {
  func = 0,
  paramType = 1,
  retType = 2
}

export interface NodeDepends {
  self: ts.Node;
  hashName: string;
  depType: DepType;
  depends: NodeDepends[];
}
