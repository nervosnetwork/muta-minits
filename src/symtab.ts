import llvm from 'llvm-node';

interface Value {
  inner: llvm.Value | Map<string, Value>;
}

class LLVMValue implements Value {
  public readonly inner: llvm.Value;
  public readonly deref: number;
  // If the type of type is a struct, fields are the fields contained in the struct
  // If the type of  is a function and the return value is an object, fields is the field of the object.
  public readonly fields?: Map<string, number>;

  constructor(inner: llvm.Value, deref: number, fields?: Map<string, number>) {
    this.inner = inner;
    this.deref = deref;
    this.fields = fields;
  }
}

class Scope implements Value {
  public name?: string;
  public inner: Map<string, Value>;
  public parent?: Scope;

  constructor(name?: string, parent?: Scope) {
    this.name = name;
    this.inner = new Map();
    this.parent = parent;
  }
}

function isLLVMValue(value: Value): value is LLVMValue {
  return value instanceof LLVMValue ? true : false;
}

function isScope(value: Value): value is Scope {
  return value instanceof Scope ? true : false;
}

class Symtab {
  public data: Scope;

  constructor() {
    this.data = new Scope('');
  }

  public into(name: string | undefined): Scope {
    const n = new Scope(name, this.data);
    if (name) {
      this.data.inner.set(name, n);
    }
    this.data = n;
    return n;
  }

  public exit(): void {
    this.data = this.data.parent!;
  }

  public name(): string {
    if (!this.data.parent) {
      return '';
    }

    const list = [];
    let n: Scope | undefined = this.data;
    for (;;) {
      if (!n) {
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
    this.data.inner.set(key, value);
  }

  public get(key: string): Value {
    let n: Scope = this.data;

    while (true) {
      const v = n.inner.get(key);
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

export { Value, Scope, Symtab, LLVMValue, isLLVMValue, isScope };
