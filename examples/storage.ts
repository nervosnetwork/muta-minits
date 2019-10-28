// A simplestorage contract for blockchain.

const STORAGE_SET = 2180;
const STORAGE_GET = 2181;
const RET = 2182;

function syscall(n: number, a: any, b: any, c: any, d: any, e: any, f: any): number {
    return 0;
}

function set_storage(k: string, v: string): number {
    return syscall(STORAGE_SET, k, v, 0, 0, 0, 0);
}

function get_storage(k: string): string {
    let v = "";
    syscall(STORAGE_GET, k, v, 0, 0, 0, 0);
    return v
}

function ret(d: string): number {
    return syscall(RET, d, 0, 0, 0, 0, 0);
}

function main(argc: number, argv: string[]): number {
    if (argc == 1) {
        return 1;
    }
    switch (argv[1]) {
        case "get":
            const v = get_storage(argv[2]);
            ret(v);
            return 0;
        case "set":
            set_storage(argv[2], argv[3]);
            return 0;
        default:
            return 1;
    }
}
