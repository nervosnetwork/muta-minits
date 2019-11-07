import { runTest } from './util';

const srcClassInit = `
class Employee {
    empCode: number;
    empName: string;
}

function main(): number {
    const a: Employee = {
        empCode: 42,
        empName: "dddd",
    };
    return a.empCode;
}
`;

runTest('test class-declaration: init', srcClassInit);
