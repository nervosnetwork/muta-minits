import llvm from 'llvm-node';

export enum StructMetaType {
  Class,
  Enum
}

export interface StructMeta {
  metaType: StructMetaType;
  typeHash?: string;
  struct: llvm.StructType;
}
