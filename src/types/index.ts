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

export interface NodeDepends {
  self: ts.Node;
  depends: NodeDepends[];
}
