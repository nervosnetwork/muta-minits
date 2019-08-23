import llvm from 'llvm-node';

import LLVMCodeGen from '../codegen';

export default class Stdlib {
  public static injection_stdio_printf(cgen: LLVMCodeGen): void {
    const funcTy = llvm.FunctionType.get(
      llvm.Type.getInt64Ty(cgen.context),
      [llvm.Type.getInt8PtrTy(cgen.context)],
      true
    );
    llvm.Function.create(funcTy, llvm.LinkageTypes.ExternalLinkage, 'printf', cgen.module);
  }
}
