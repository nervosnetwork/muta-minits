import llvm from 'llvm-node';

import LLVMCodeGen from '../codegen';

export default class Stdlib {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public printf(): llvm.FunctionType {
    return llvm.FunctionType.get(
      llvm.Type.getInt64Ty(this.cgen.context),
      [llvm.Type.getInt8PtrTy(this.cgen.context)],
      true
    );
  }

  public strcmp(): llvm.FunctionType {
    return llvm.FunctionType.get(
      llvm.Type.getInt64Ty(this.cgen.context),
      [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)],
      false
    );
  }
}
