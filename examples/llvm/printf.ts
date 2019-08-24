// Print "Hello World!" by LLVM
//
// Usage:
//   $ ts-node examples/llvm/printf.ts
//   $ lli /tmp/minits.ll
import * as llvm from "llvm-node";
import fs from "fs";

function main() {
    const context = new llvm.LLVMContext()
    const module = new llvm.Module("main", context)
    const builder = new llvm.IRBuilder(context)

    const funcPrintfTy = llvm.FunctionType.get(
        llvm.Type.getInt64Ty(context),
        [llvm.Type.getInt8Ty(context).getPointerTo()],
        true
    )
    const funcPrintf = llvm.Function.create(funcPrintfTy, llvm.LinkageTypes.ExternalLinkage, "printf", module)

    const funcMainTy = llvm.FunctionType.get(
        llvm.Type.getVoidTy(context),
        false,
    )
    const funcMain = llvm.Function.create(funcMainTy, llvm.LinkageTypes.ExternalLinkage, "main", module)
    const body = llvm.BasicBlock.create(context, 'body', funcMain)
    builder.setInsertionPoint(body)

    const strType = llvm.ArrayType.get(llvm.Type.getInt8Ty(context), 14)
    const str = llvm.ConstantArray.get(strType, [
        llvm.ConstantInt.get(context, 0x48, 8), // H
        llvm.ConstantInt.get(context, 0x65, 8), // E
        llvm.ConstantInt.get(context, 0x6c, 8), // L
        llvm.ConstantInt.get(context, 0x6c, 8), // L
        llvm.ConstantInt.get(context, 0x6f, 8), // O
        llvm.ConstantInt.get(context, 0x20, 8), //
        llvm.ConstantInt.get(context, 0x57, 8), // W
        llvm.ConstantInt.get(context, 0x6f, 8), // O
        llvm.ConstantInt.get(context, 0x72, 8), // R
        llvm.ConstantInt.get(context, 0x6c, 8), // L
        llvm.ConstantInt.get(context, 0x64, 8), // D
        llvm.ConstantInt.get(context, 0x21, 8), // !
        llvm.ConstantInt.get(context, 0x0a, 8), // \n
        llvm.ConstantInt.get(context, 0x00, 8), // \0
    ]);
    const ptr = builder.createAlloca(strType);
    builder.createStore(str, ptr);

    const fmtArg = builder.createBitCast(ptr, llvm.Type.getInt8Ty(context).getPointerTo())

    builder.createCall(funcPrintf, [fmtArg]);
    builder.createRetVoid();

    llvm.initializeAllTargetInfos();
    llvm.initializeAllTargets();
    llvm.initializeAllTargetMCs();
    llvm.initializeAllAsmParsers();
    llvm.initializeAllAsmPrinters();
    const target = llvm.TargetRegistry.lookupTarget(llvm.config.LLVM_DEFAULT_TARGET_TRIPLE);
    const m = target.createTargetMachine(llvm.config.LLVM_DEFAULT_TARGET_TRIPLE, 'generic');
    module.dataLayout = m.createDataLayout();
    module.targetTriple = llvm.config.LLVM_DEFAULT_TARGET_TRIPLE;

    fs.writeFileSync("/tmp/minits.ll", module.print());
}

main()
