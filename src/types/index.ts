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

export interface SymbolMeta {
  value: llvm.Value;
  deref: number;
  fields?: Map<string, number>;
}
