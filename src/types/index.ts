import llvm from 'llvm-node';

export enum StructMetaType {
  Class,
  Enum
}

export interface StructMeta {
  metaType: StructMetaType;
  fields: Map<string, number>;
}

export interface SymtabMeta {
  value: llvm.Value;
}
