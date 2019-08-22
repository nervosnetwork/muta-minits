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
import { SymtabMeta } from './types';

export default class Symtab {
  public readonly scopes: Stack<Map<string, SymtabMeta>>;

  constructor() {
    this.scopes = new Stack();
    this.scopes.push(new Map());
  }

  public into(): void {
    this.scopes.push(new Map());
  }

  public exit(): void {
    if (this.scopes.size() > 0) {
      this.scopes.pop();
    }
  }

  public set(key: string, value: SymtabMeta): void {
    this.scopes.peek().set(key, value);
  }

  public get(key: string): SymtabMeta {
    const len = this.scopes.size();

    for (let i = len - 1; i >= 0; i--) {
      const optValue = this.scopes.index(i).get(key);
      if (optValue) {
        return optValue;
      }
    }

    throw new Error(`Symbol ${key} not found`);
  }

  public check(key: string): boolean {
    return this.get(key) !== null;
  }

  public isGlobal(): boolean {
    return this.scopes.size() === 1;
  }
}

class Stack<T> {
  private readonly elements: T[] = [];

  public peek(): T {
    if (this.isEmpty()) {
      throw new Error('Stack is empty');
    }

    return this.elements[this.size() - 1];
  }

  public pop(): T | undefined {
    if (this.isEmpty()) {
      throw new Error('Stack is empty');
    }

    return this.elements.pop();
  }

  public push(t: T): void {
    this.elements.push(t);
  }

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public size(): number {
    return this.elements.length;
  }

  public index(index: number): T {
    return this.elements[index];
  }
}
