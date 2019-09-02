import llvm from 'llvm-node';

class Value {
  public inner: llvm.Value;
  public deref: number;
  // If the type of type is a struct, fields are the fields contained in the struct
  // If the type of  is a function and the return value is an object, fields is the field of the object.
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
  public data: Scope;

  constructor() {
    this.data = new Scope('');
  }

  public into(name: string | undefined): Scope {
    const n = new Scope(name, this.data);
    if (name) {
      this.data.data.set(name, n);
    }
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

  public set(key: string, value: Value | Scope): void {
    this.data.data.set(key, value);
  }

  public get(key: string): Value | Scope {
    let n = this.data;

    while (true) {
      const v = n.data.get(key);
      if (v) {
        return v;
      }

      if (n.parent) {
        n = n.parent;
      } else {
        throw new Error(`Symbol ${key} not found`);
      }
    }
  }
}

export { Value, Scope, Symtab };
