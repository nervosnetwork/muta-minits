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

const srcClassAsFunctionArgument = `
class Employee {
    empCode: number;
    empName: string;
}

function getEmpCode(emp: Employee): number {
    return emp.empCode
}

function main(): number {
    const a: Employee = {
        empCode: 42,
        empName: "dddd",
    };
    return getEmpCode(a);
}
`;

runTest('test class: init', srcClassInit);
runTest('test class: as function argument', srcClassAsFunctionArgument);
