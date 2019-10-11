# TEST

Since **minits** is designed for running on multiple platform, 
the test case would compare output stream rather than compare return value.

## Requirement

- LLVM >= 9 (make sure `lli` is in the PATH)
- NodeJS >= 10

```shell
cd path/to/minits
cd tests
node test.js
```

## How to write a test case

- create a new _.ts_ file under _tests_ folder
- create a `main` function
- use `console.log` to output the result

