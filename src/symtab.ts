import llvm from 'llvm-node';

class Value {
  public inner: llvm.Value;
  public deref: number;
  public fields?: Map<string, number>;

  constructor(inner: llvm.Value, deref: number, fields?: Map<string, number>) {
    this.inner = inner;
    this.deref = deref;
    this.fields = fields;
  }
}

class Scope {
  public name: string | undefined;
  public data: Map<string, Value | Scope>;
  public parent: Scope | undefined;

  constructor(name: string | undefined, parent?: Scope | undefined) {
    this.name = name;
    this.data = new Map();
    this.parent = parent;
  }
}

class Symtab {
  private data: Scope;

  constructor() {
    this.data = new Scope('');
  }

  public into(name: string | undefined): Scope {
    const n = new Scope(name, this.data);
    this.data = n;
    return n;
  }

  public exit(): void {
    this.data = this.data.parent!;
  }

  public name(): string {
    if (this.data.parent === undefined) {
      return '';
    }
    const list = [];
    let n: Scope | undefined = this.data;
    for (;;) {
      if (n === undefined) {
        break;
      }
      if (n.name) {
        list.push(n.name);
      }
      n = n.parent;
    }
    return list.reverse().join('.') + '.';
  }

  public with(name: string | undefined, body: () => void): void {
    this.into(name);
    body();
    this.exit();
  }

  public set(key: string, value: Value): void {
    this.data.data.set(key, value);
  }

  public get(key: string): Value | Scope {
    let n = this.data;
    for (;;) {
      const v = n.data.get(key);
      if (v !== undefined) {
        return v;
      }
      if (this.data.parent) {
        n = this.data.parent;
        continue;
      }
      throw new Error(`Symbol ${key} not found`);
    }
  }
}

export { Value, Scope, Symtab };
