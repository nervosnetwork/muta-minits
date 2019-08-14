import llvm from 'llvm-node';

export class Symtab {
  protected readonly data: Map<string, llvm.Value>;

  constructor() {
    this.data = new Map();
  }

  public get(name: string): llvm.Value {
    const r = this.data.get(name);
    if (r) {
      return r;
    }
    throw new Error('Unsupported grammar');
  }

  public set(name: string, data: llvm.Value): void {
    this.data.set(name, data);
  }
}
