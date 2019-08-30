let globalarr: string[] = ["10", "20"];

function main(): number {
    let localarr: string[] = ["10", "20"];
    if (globalarr[0] !== localarr[0]) {
        return 1;
    }
    if (globalarr[1] !== localarr[1]) {
        return 1;
    }
    return 0;
}
