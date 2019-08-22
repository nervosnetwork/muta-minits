import llvm from 'llvm-node';

export enum StructMetaType {
  Class,
  Enum
}

export type StructMeta = {
  metaType: StructMetaType;
  fields: Map<string, number>;
};

export type SymtabMeta = {
  value: llvm.Value;
};
