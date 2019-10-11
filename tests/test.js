const { execSync } = require('child_process');
const path = require('path');
const shell = require('shelljs');
const ts = require('typescript');
const fs = require('fs');

function cd(...args) {
  return path.join(__dirname, ...args);
}

shell.rm('-rf', cd('output'));
shell.mkdir('output');

function run() {
  const cases = fs.readdirSync(__dirname).filter(filename => filename.endsWith('.ts'));
  cases.forEach(file => {
    console.log(`testing ${file}`);

    const input = `${cd(file)}`;
    const outputIR = `${cd('output', `${file}.ll`)}`;

    const buildEntry = cd('../build/main/index.js');
    const buildIR = ['node', buildEntry, 'build', '-o', `${outputIR}`, input].join(' ');
    execSync(buildIR);
    const actual = execSync(`lli ${outputIR}`).toString();

    const transpiled = ts.transpileModule(fs.readFileSync(cd(file)).toString(), {}).outputText;
    fs.writeFileSync(
      cd('output', `${file}.js`),
      `
const printf = require('printf');
console.log = (...args) => process.stdout.write(printf(...args));
${transpiled}
main();`
    );
    const expected = execSync(`node ${cd('output', file)}`).toString();

    const passed = String(actual.trim()) === String(expected.trim());
    if (!passed) {
      console.error(`❌ ${file} expect: ${expected}, actual: ${actual}`);
    } else {
      console.log(`✅ ${file}`);
    }
  });
}

run();
