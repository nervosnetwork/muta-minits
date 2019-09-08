import llvm from 'llvm-node';
import ts from 'typescript';

import * as common from '../common';
import * as symtab from '../symtab';
import LLVMCodeGen from './';

export default class CodeGenFuncDecl {
  private cgen: LLVMCodeGen;

  constructor(cgen: LLVMCodeGen) {
    this.cgen = cgen;
  }

  public genCallExpression(node: ts.CallExpression): llvm.Value {
    const name = node.expression.getText();

    switch (name) {
      case 'console.log':
        return this.cgen.stdlib.printf(this.genArguments(node.arguments));
      case 'printf':
        return this.cgen.stdlib.printf(this.genArguments(node.arguments));
      case 'strcmp':
        return this.cgen.stdlib.strcmp(this.genArguments(node.arguments));
      case 'strlen':
        return this.cgen.stdlib.strlen(this.genArguments(node.arguments));
      case 'syscall':
        return this.cgen.stdlib.syscall(this.genArguments(node.arguments));
      default:
        const hashName = common.genFunctionHashWithCall(this.cgen.checker, node);
        const value = this.cgen.symtab.get(hashName);
        if (symtab.isLLVMValue(value)) {
          return this.cgen.builder.createCall(value.inner, this.genArguments(node.arguments));
        }

        throw new Error('The type retrieved from the symbol table must be LLVM value.');
    }
  }

  private genArguments(args: ts.NodeArray<ts.Expression>): llvm.Value[] {
    return args.map(item => this.cgen.genExpression(item));
  }
}
