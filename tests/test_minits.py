import os
import subprocess


def compare(path: str):
    with open(path, 'r') as f:
        data = f.read()
    with open('/tmp/minits.ts', 'w') as f:
        f.write(data)
        f.write('\n')
        f.write('process.exit(main());')
    a = subprocess.call(f'ts-node /tmp/minits.ts', shell=True)
    b = subprocess.call(f'ts-node src/index.ts run {path}', shell=True)
    assert a == b


def cmppath(path: str):
    for e in os.scandir(path):
        if e.is_dir():
            cmppath(e.path)
            continue
        try:
            compare(os.path.abspath(e.path))
        except Exception as err:
            print('[x]', e.path, err)
            break
        else:
            print('[v]', e.path)


def main():
    cmppath('tests/ts')


if __name__ == '__main__':
    main()
