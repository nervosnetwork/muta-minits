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

  // public static streql(cgen: LLVMCodeGen): llvm.Function {
  //   let func = cgen.module.getFunction('streql');
  //   if (func) {
  //     return func;
  //   }
  //   const funcTy = llvm.FunctionType.get(
  //     llvm.Type.getInt1Ty(cgen.context),
  //     [llvm.Type.getInt8PtrTy(cgen.context), llvm.Type.getInt8PtrTy(cgen.context)],
  //     false
  //   );
  //   func = llvm.Function.create(funcTy, llvm.LinkageTypes.ExternalLinkage, 'streql', cgen.module);
  //   const body = llvm.BasicBlock.create(cgen.context, 'body', func);
  //   const rawBlock = cgen.builder.getInsertBlock()!;
  //   cgen.builder.setInsertionPoint(body);
  //   const strcmp = cgen.module.getOrInsertFunction('strcmp', this.strcmp(cgen));
  //   const ret = cgen.builder.createCall(strcmp, func.getArguments());
  //   const r = cgen.builder.createICmpEQ(ret, llvm.ConstantInt.get(cgen.context, 0, 64));
  //   cgen.builder.createRet(r);
  //   cgen.builder.setInsertionPoint(rawBlock);
  //   return func;
  // }
}
