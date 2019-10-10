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

# Analysis for a minits Program: Brainfuck

minits is a completely static language, similar to clang or rust, `function main()` is the entry point to every executable minits program. It receives(optional) 2 parameters `argc: number` and `argv: string[]`, and returns the exit code. So you can also write it as `function main(argc: number, argc: string[]): number`.

We suggest you read the source code under `./examples`. Let's hava a look at `./examples/brainfuck.ts`. Brainfuck is an esoteric programming language created in 1993 by Urban Müller, and is notable for its extreme minimalism. We wrote a brainfuck interpreter by minits. Compile this interpreter by

```
$ node build/main/index.js build examples/brainfuck.ts -o brainfuck.ll
$ clang brainfuck.ll -o brainfuck
```

And then execute a piece of code that generates Sierpinski Triangle:

```
$ ./brainfuck ">++++[<++++++++>-]>++++++++[>++++<-]>>++>>>+>>>+<<<<<<<<<<[-[->+<]>[-<+>>>.<<]>>>[[->++++++++[>++++<-]>.<<[->+<]+>[->++++++++++<<+>]>.[-]>]]+<<<[-[->+<]+>[-<+>>>-[->+<]++>[-<->]<<<]<<<<]++++++++++.+++.[-]<]+++++"
```

![img](/res/brainfuck.png)

Most ts syntax is available at now, but there is still a lot of work to be done.

# Project status

We plan to implement the following syntax:

## Types

- [ ] Primitive Types
    - [x] number(support signed 64): `0x10`, `12`
    - [x] boolean: `true`, `false`
    - [x] string: `"Hello"`
    - [x] void
    - [ ] null
    - [ ] <del>* undefined</del>
    - [x] enum: `enum { a = 1, b, c }`
- [ ] Object
    - [x] Array
    - [ ] Tuple

## Expression

- [x] Assignment: `let a: number = 1;`, `let a: number[] = [1, 2, 3]`
- [x] Parentheses
- [x] Function Expressions
- [ ] Arrow Functions
- [ ] * Class Expressions
- [x] Function Calls
- [x] `++` / `--`
- [x] `+` / `-` / `~`
- [x] `!`
- [ ] * `typeof`
- [x] +: number + number, string + string, eg.
- [x] `*`, `/`, `%,` `–`, `<<`, `>>`, `>>>`, `&`, `^`, and `|` operators
- [x] `<`, `>`, `<=`, `>=`, `==`, `!=`, `===`, and `!==` operators
- [ ] * `in`
- [x] `&&` and `||`
- [x] The Conditional Operator: `test ? expr1 : expr2`
- [x] `*=`, `/=`, `%=`, `+=`, `-=`, `<<=`, `>>=`, `>>>=`, `&=`, `^=`, `|=`
- [ ] <del> Destructuring Assignment: `[x, y] = [y, x];` </del>

## Statements

- [x] Block
- [x] Variable Statements
- [x] Let and Const Declarations
- [x] If, Do, and While Statements
- [x] For Statements
- [ ] <del>For-In Statements</del>
- [x] For-Of Statements
- [x] Continue Statements
- [x] Break Statements
- [x] Return Statements
- [ ] <del> With Statements </del>
- [x] Switch Statements
- [ ] Throw Statements
- [ ] * Try Statements

## Function

- [x] Function Declarations
- [x] Function Implementations


## Interfaces

TODO

## Class

- [ ] Class Declarations
- [ ] New class

## Build in functions

- [ ] See: https://www.tutorialspoint.com/javascript/javascript_builtin_functions.htm

# Licences

[MIT](/LICENSE)
