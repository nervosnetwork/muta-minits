import llvm from 'llvm-node';

import LLVMCodeGen from '../codegen';

export default class Stdlib {
  public static printf(cgen: LLVMCodeGen): llvm.FunctionType {
    return llvm.FunctionType.get(llvm.Type.getInt64Ty(cgen.context), [llvm.Type.getInt8PtrTy(cgen.context)], true);
  }

  public static strcmp(cgen: LLVMCodeGen): llvm.FunctionType {
    return llvm.FunctionType.get(
      llvm.Type.getInt64Ty(cgen.context),
      [llvm.Type.getInt8PtrTy(cgen.context), llvm.Type.getInt8PtrTy(cgen.context)],
      false
    );
  }
}
