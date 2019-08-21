import LLVMCodeGen from '../codegen';
import { injection_stdio_printf } from './system';

class Stdlib {
  public static injection(cgen: LLVMCodeGen): void {
    if (!cgen.module.targetTriple.includes('riscv')) {
      injection_stdio_printf(cgen);
    }
  }
}

export = Stdlib;
