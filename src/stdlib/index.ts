import llvm from 'llvm-node';

import LLVMCodeGen from '../codegen';

export class Stdlib {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public printf(args: llvm.Value[]): llvm.Value {
    const name = 'printf';
    const i = [llvm.Type.getInt8PtrTy(this.cgen.context)];
    const varg = true;
    const o = llvm.Type.getInt64Ty(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    return this.cgen.builder.createCall(func, args);
  }

  public strcat(args: llvm.Value[]): llvm.Value {
    const name = 'strcat';
    const i = [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)];
    const varg = false;
    const o = llvm.Type.getInt8PtrTy(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    return this.cgen.builder.createCall(func, args);
  }

  public strcmp(args: llvm.Value[]): llvm.Value {
    const name = 'strcmp';
    const i = [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)];
    const varg = false;
    const o = llvm.Type.getInt64Ty(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    return this.cgen.builder.createCall(func, args);
  }

  public strcpy(args: llvm.Value[]): llvm.Value {
    const name = 'strcpy';
    const i = [llvm.Type.getInt8PtrTy(this.cgen.context), llvm.Type.getInt8PtrTy(this.cgen.context)];
    const varg = false;
    const o = llvm.Type.getInt8PtrTy(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    return this.cgen.builder.createCall(func, args);
  }

  public strlen(args: llvm.Value[]): llvm.Value {
    const name = 'strlen';
    const i = [llvm.Type.getInt8PtrTy(this.cgen.context)];
    const varg = false;
    const o = llvm.Type.getInt64Ty(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    return this.cgen.builder.createCall(func, args);
  }

  public syscall(args: llvm.Value[]): llvm.Value {
    const name = 'syscall';
    const i = [
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context),
      llvm.Type.getInt64Ty(this.cgen.context)
    ];
    const varg = false;
    const o = llvm.Type.getInt64Ty(this.cgen.context);
    const func = this.cgen.module.getOrInsertFunction(name, llvm.FunctionType.get(o, i, varg));
    const argl = args.map(item => {
      if (item.type.isPointerTy()) {
        return this.cgen.builder.createPtrToInt(item, llvm.Type.getInt64Ty(this.cgen.context));
      }
      return item;
    });
    return this.cgen.builder.createCall(func, argl);
  }
}
