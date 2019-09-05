import llvm from 'llvm-node';

import LLVMCodeGen from '../codegen';

export default class Stdlib {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public printf(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'printf',
      llvm.FunctionType.get(llvm.Type.getInt64Ty(this.cgen.context), [llvm.Type.getInt8PtrTy(this.cgen.context)], true)
    );
    return this.cgen.builder.createCall(func, args);
  }

  public strcat(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'strcat',
      llvm.FunctionType.get(
        llvm.Type.getInt8PtrTy(this.cgen.context),
        [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)],
        false
      )
    );
    return this.cgen.builder.createCall(func, args);
  }

  public strcmp(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'strcmp',
      llvm.FunctionType.get(
        llvm.Type.getInt64Ty(this.cgen.context),
        [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)],
        false
      )
    );
    return this.cgen.builder.createCall(func, args);
  }

  public strcpy(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'strcpy',
      llvm.FunctionType.get(
        llvm.Type.getInt8PtrTy(this.cgen.context),
        [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)],
        false
      )
    );
    return this.cgen.builder.createCall(func, args);
  }

  public strlen(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'strlen',
      llvm.FunctionType.get(llvm.Type.getInt64Ty(this.cgen.context), [llvm.Type.getInt8PtrTy(this.cgen.context)], false)
    );
    return this.cgen.builder.createCall(func, args);
  }

  public syscall(args: llvm.Value[]): llvm.Value {
    const func = this.cgen.module.getOrInsertFunction(
      'syscall',
      llvm.FunctionType.get(
        llvm.Type.getInt64Ty(this.cgen.context),
        [
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context),
          llvm.Type.getInt64Ty(this.cgen.context)
        ],
        false
      )
    );
    const argl = args.map(item => {
      if (item.type.isPointerTy()) {
        return this.cgen.builder.createPtrToInt(item, llvm.Type.getInt64Ty(this.cgen.context));
      }
      return item;
    });
    return this.cgen.builder.createCall(func, argl);
  }
}
