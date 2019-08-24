let globalstr = "globalstr\n";

function main(): number {
    let localstr = "localstr\n";
    console.log(globalstr);
    console.log(localstr);
    console.log("%s", globalstr);
    console.log("%s", localstr);
    console.log("%d\n", 42);
    return 0;
}
