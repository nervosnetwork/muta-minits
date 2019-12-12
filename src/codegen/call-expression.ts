import llvm from 'llvm-node';
import ts from 'typescript';

import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genCallExpression(node: ts.CallExpression): llvm.Value {
    // const funcDecl = this.cgen.checker.getResolvedSignature(node)!.getDeclaration() as ts.FunctionDeclaration;
    const funcName = node.expression.getText();
    const callArgs = node.arguments.map(item => this.cgen.genExpression(item));

    switch (funcName) {
      case 'atoi':
        return this.cgen.stdlib.atoi(callArgs);
      case 'console.log':
        return this.cgen.stdlib.printf(callArgs);
      case 'itoa':
        return this.cgen.stdlib.itoa(callArgs);
      case 'malloc':
        return this.cgen.stdlib.malloc(callArgs);
      case 'parseInt':
        return this.cgen.stdlib.atoi(callArgs);
      case 'printf':
        return this.cgen.stdlib.printf(callArgs);
      case `sprintf`:
        return this.cgen.stdlib.sprintf(callArgs);
      case 'strcat':
        return this.cgen.stdlib.strcat(callArgs);
      case 'strcmp':
        return this.cgen.stdlib.strcmp(callArgs);
      case 'strcpy':
        return this.cgen.stdlib.strcpy(callArgs);
      case 'strlen':
        return this.cgen.stdlib.strlen(callArgs);
      case 'syscall':
        return this.cgen.stdlib.syscall(callArgs);
      default:
        const func = this.cgen.genExpression(node.expression) as llvm.Function;
        return this.cgen.builder.createCall(func, callArgs);
    }
  }
}
