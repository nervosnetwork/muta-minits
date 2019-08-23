let globalstr = "Hello World!";

function main(): number {
    console.log("console.log: Hello %s\n", "World!");
    console.log("console.log: %s\n", globalstr);
    console.log("consoel.log: %d is everything\n", 42);
    let s = "World!";
    console.log("console.log: Hello %s\n", s);
    let d = 42;
    console.log("consoel.log: %d is everything\n", d);
    return 0;
}
