# Minits

[![Build Status](https://travis-ci.org/cryptape/minits.svg?branch=master)](https://travis-ci.org/cryptape/minits)

Typescript with LLVM backend.

![img](/res/flow.png)

# Installing minits on Linux or macOS

First of all, you need install LLVM, See [https://llvm.org/docs/GettingStarted.html](https://llvm.org/docs/GettingStarted.html). But if you are using Ubuntu or other distributions, using the built-in package management tool is a more convenient option like:

```
$ apt install -y llvm
```

Then install minits:

```
$ git clone https://github.com/cryptape/minits
$ npm install
$ npm build
```

# Writing and Compiling a TypeScript Program

Filename: main.ts

```ts
function main(): number {
    console.log("Hello World!");
    return 0;
}
```

Save the file and open your terminal:

```
$ node build/main/index.js build main.ts -o main.ll
$ clang main.ll -o main
$ ./main
```

# Analysis for a minits Program

minits is a completely static language, similar to clang or rust, `function main()` is the entry point to every executable minits program. It receives(optional) 2 parameters `argc: number` and `argv: string[]`, and returns the exit code. So you can also write it as `function main(argc: number, argc: string[]): number`.

We suggest you read the source code under `./examples`, we implement a subset of the ts syntax.

| FileName                | Description                        |
|-------------------------|------------------------------------|
| ./examples/brainfuck.ts | A `brainfuck` language interpreter |
| ./examples/fibonacci.ts | Fibonacci                          |

# Licences

[MIT](/LICENSE)
