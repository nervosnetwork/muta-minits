import llvm from 'llvm-node';

interface Node {
  data: llvm.Value | Map<string, Node>;
}

class Leaf implements Node {
  public readonly data: llvm.Value;
  public readonly ptrs: number;

  constructor(data: llvm.Value, ptrs: number) {
    this.data = data;
    this.ptrs = ptrs;
  }
}

class Meso implements Node {
  public parent: Meso | undefined;
  public name: string;
  public deep: number;
  public data: Map<string, Node>;

  constructor(parent: Meso | undefined, name: string) {
    this.parent = parent;
    this.name = name;
    this.deep = this.parent ? this.parent.deep + 1 : 0;
    this.data = new Map();
  }
}

function isLeaf(node: Node): node is Leaf {
  return node instanceof Leaf;
}

function isMeso(node: Node): node is Meso {
  return node instanceof Meso;
}

class Symtab {
  public data: Meso;

  constructor() {
    this.data = new Meso(undefined, 'main');
  }

  public deep(): number {
    return this.data.deep;
  }

  public into(name: string): Meso {
    const n = new Meso(this.data, name);
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
    if (!this.data.parent) {
      return '';
    }

    const list = [];
    let n: Meso | undefined = this.data;
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

  public with(name: string, body: () => void): void {
    this.into(name);
    body();
    this.exit();
  }

  public set(key: string, node: Node): void {
    this.data.data.set(key, node);
  }

  public get(key: string): Node {
    const node = this.tryGet(key);
    if (node) {
      return node;
    }
    throw new Error(`Symbol ${key} not found`);
  }

  public tryGet(key: string): Node | null {
    let n: Meso = this.data;

    while (true) {
      const v = n.data.get(key);
      if (v) {
        return v;
      }

      if (n.parent) {
        n = n.parent;
      } else {
        return null;
      }
    }
  }
}

export { Node, Leaf, Meso, isLeaf, isMeso, Symtab };
