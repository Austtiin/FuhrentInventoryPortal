import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('../scripts/build-static.js', import.meta.url));
const script = readFileSync(scriptPath, 'utf8');

function runBuild({ buildFails = false, configMissing = false } = {}) {
  const files = new Map([
    [path.resolve(path.dirname(scriptPath), '..', 'next.config.ts'), 'original config'],
    [path.resolve(path.dirname(scriptPath), '..', 'next.config.static.ts'), 'static config'],
    [path.resolve(path.dirname(scriptPath), '..', 'src', 'app', 'inventory', 'page.tsx'), 'inventory page'],
  ]);
  const accessConfig = path.resolve(path.dirname(scriptPath), '..', 'staticwebapp.config.json');
  if (!configMissing) files.set(accessConfig, 'access rules');
  const process = { exitCode: undefined, execPath: 'node' };
  const fs = {
    existsSync: file => files.has(file),
    readFileSync: file => files.get(file),
    writeFileSync: (file, value) => files.set(file, value),
    unlinkSync: file => files.delete(file),
    copyFileSync: (from, to) => {
      if (!files.has(from)) throw new Error(`Missing ${from}`);
      files.set(to, files.get(from));
    },
  };
  const require = name => {
    if (name === 'fs') return fs;
    if (name === 'path') return path;
    if (name === 'child_process') return { execFileSync() { if (buildFails) throw new Error('Build failed'); } };
    throw new Error(`Unexpected module ${name}`);
  };
  require.resolve = name => {
    assert.equal(name, 'next/dist/bin/next');
    return 'next-cli';
  };
  vm.runInNewContext(script, {
    __dirname: path.dirname(scriptPath),
    console: { log() {}, error() {} },
    process,
    require,
  });
  return { files, exitCode: process.exitCode };
}

test('static build includes access rules and restores source files', () => {
  const { files, exitCode } = runBuild();
  const root = path.resolve(path.dirname(scriptPath), '..');
  assert.equal(exitCode, undefined);
  assert.equal(files.get(path.join(root, 'out', 'staticwebapp.config.json')), 'access rules');
  assert.equal(files.get(path.join(root, 'next.config.ts')), 'original config');
  assert.equal(files.get(path.join(root, 'src', 'app', 'inventory', 'page.tsx')), 'inventory page');
  assert.equal(files.has(path.join(root, 'next.config.original.ts')), false);
});

test('failed compilation or missing access rules fail the build and restore configuration', () => {
  for (const options of [{ buildFails: true }, { configMissing: true }]) {
    const { files, exitCode } = runBuild(options);
    assert.equal(exitCode, 1);
    assert.equal(files.get(path.resolve(path.dirname(scriptPath), '..', 'next.config.ts')), 'original config');
  }
});
