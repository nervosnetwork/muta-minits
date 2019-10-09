import llvm from 'llvm-node';
import ts from 'typescript';

import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genCallExpression(node: ts.CallExpression): llvm.Value {
    const funcDecl = this.cgen.checker.getResolvedSignature(node)!.getDeclaration() as ts.FunctionDeclaration;
    const funcName = node.expression.getText();
    const callArgs = node.arguments.map(item => this.cgen.genExpression(item));

    switch (funcName) {
      case 'console.log':
        return this.cgen.stdlib.printf(callArgs);
      case 'printf':
        return this.cgen.stdlib.printf(callArgs);
      case 'strcmp':
        return this.cgen.stdlib.strcmp(callArgs);
      case 'strlen':
        return this.cgen.stdlib.strlen(callArgs);
      case 'syscall':
        return this.cgen.stdlib.syscall(callArgs);
      default:
        const value = this.cgen.symtab.get(funcName);
        const func = (value as symtab.LLVMValue).inner as llvm.Function;
        const frgs = func.getArguments();
        const back: Array<{ src: llvm.Value; dst: llvm.Value }> = [];

        for (let i = 0; i < callArgs.length; i++) {
          const farg = frgs[i];
          // Perform automatic type conversion
          //
          // 1. DukeType Object Literal
          //
          // Implicit type conversion is used to implement DukeType Object Literal.
          // When a function declares a parameter's type as a subset of another type, passing in the larger type value
          // will lead to type conversion. Look at this sample:
          //
          //   function echo(o: {a: number}): void {}
          //   const arg0 = {a: 0, b: 1};
          //   echo(arg0);
          //
          // The actual execution code is:
          //   const unnamed = { a: arg0.a };
          //   echo(unnamed);
          //   arg0.a = unnamed.a;
          if (!callArgs[i].type.equals(farg.type)) {
            const a = farg.type;
            const b = callArgs[i].type;
            if (
              a.isPointerTy() &&
              b.isPointerTy() &&
              (a as llvm.PointerType).elementType.isStructTy() &&
              (b as llvm.PointerType).elementType.isStructTy()
            ) {
              const dstPtr = this.cgen.builder.createAlloca((a as llvm.PointerType).elementType);
              const dstType = this.cgen.checker.getTypeAtLocation(funcDecl.parameters[i]);
              const dstProperties = this.cgen.checker.getPropertiesOfType(dstType);
              for (let j = 0; j < dstProperties.length; j++) {
                const memberName = dstProperties[j].name;
                const memberPtr = this.cgen.builder.createInBoundsGEP(dstPtr, [
                  llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
                  llvm.ConstantInt.get(this.cgen.context, j, 32, true)
                ]);

                const srcType = this.cgen.checker.getTypeAtLocation(node.arguments[i]);
                const srcProperties = this.cgen.checker.getPropertiesOfType(srcType);
                const srcIndex = srcProperties.findIndex(property => property.name === memberName);
                const srcPtr = this.cgen.builder.createInBoundsGEP(callArgs[i], [
                  llvm.ConstantInt.get(this.cgen.context, 0, 32, true),
                  llvm.ConstantInt.get(this.cgen.context, srcIndex, 32, true)
                ]);
                const srcVal = this.cgen.builder.createLoad(srcPtr);
                this.cgen.builder.createStore(srcVal, memberPtr);
                back.push({ src: memberPtr, dst: srcPtr });
              }
              callArgs[i] = dstPtr;
            }
          }
        }
        const r = this.cgen.builder.createCall(func, callArgs);
        for (const e of back) {
          const v = this.cgen.builder.createLoad(e.src);
          this.cgen.builder.createStore(v, e.dst);
        }
        return r;
    }
  }
}
