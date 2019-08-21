// Symbol Table.
//
// let a = 1;                              ---> symtab.set('a', 1)
//
// function echo(b: number): number {
//    return a                             ---> symtab.get('echo').get('a') --> symtab.get('a')
//           +
//           b;                            ---> symtab.get('echo').get('b')
// }
//
import llvm from 'llvm-node';

class Scopes {
  public data: Map<string, Scopes | llvm.Value>;

  constructor() {
    this.data = new Map();
  }
}

export default class Symtab {
  protected readonly data: Scopes;
  protected prefix: string[];

  constructor() {
    this.data = new Scopes();
    this.prefix = [];
  }

  public into(name: string): void {
    this.prefix.push(name);
  }

  public exit(): void {
    this.prefix.pop();
  }

  public get(name: string): llvm.Value {
    for (let i = this.prefix.length; i >= 0; i--) {
      const r = this.getLowValue(this.data, this.prefix.slice(0, i), name);
      if (r) {
        return r as llvm.Value;
      }
    }
    throw new Error('Unsupported grammar');
  }

  public set(name: string, data: llvm.Value): void {
    this.getLowScopes(this.data, this.prefix).data.set(name, data);
  }

  public depths(): number {
    return this.prefix.length;
  }

  private getLowScopes(scopes: Scopes, prefix: readonly string[]): Scopes {
    if (prefix.length === 0) {
      return scopes;
    }
    const current = prefix[0];
    const remains = prefix.slice(1);
    const next = scopes.data.get(current);
    if (next === undefined) {
      const r = new Scopes();
      this.data.data.set(current, r);
      return r;
    }
    if (next instanceof llvm.Value) {
      throw new Error('Unsupported grammar');
    }
    return this.getLowScopes(next as Scopes, remains);
  }

  private getLowValue(scopes: Scopes, prefix: readonly string[], name: string): llvm.Value | undefined {
    const r = this.getLowScopes(scopes, prefix).data.get(name);
    if (r === undefined) {
      return undefined;
    }
    if (r instanceof Scopes) {
      throw new Error('Unsupported grammar');
    }
    return r as llvm.Value;
  }
}
