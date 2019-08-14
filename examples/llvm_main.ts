import * as argv from "commander";
import * as llvm from "llvm-node";
import * as ts from "typescript";

function main() {
    const context = new llvm.LLVMContext();
    const module = new llvm.Module("test", context);

    const intType = llvm.Type.getInt32Ty(context);
    const initializer = llvm.ConstantInt.get(context, 0);
    const globalVariable = new llvm.GlobalVariable(module, intType, true, llvm.LinkageTypes.InternalLinkage, initializer);

    const ll = module.print();
    console.log(ll);
    llvm.writeBitcodeToFile(module, "/tmp/out.bc");
}

main()
