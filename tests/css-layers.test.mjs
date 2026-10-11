import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Component CSS can be bundled before the main stylesheet, and minifiers drop a
// redundant `@layer a, b, c;` statement. If the file that lands first opens a
// layer block without declaring the order, the fallback is first-appearance
// order and `reset` silently overrides every component rule. Guard the
// invariant at the source, where it is cheap to check.
const ORDER = '@layer reset, base, components;';
const STYLES = new URL('../src/styles/', import.meta.url);

test('every stylesheet declares the cascade layer order before using a layer', async () => {
  const files = (await readdir(STYLES)).filter((name) => name.endsWith('.css'));
  assert.ok(files.length > 0, 'expected stylesheets in src/styles/');
  for (const name of files) {
    const source = await readFile(new URL(name, STYLES), 'utf8');
    const block = source.search(/@layer\s+[\w-]+\s*\{/);
    if (block === -1) continue;
    const declared = source.indexOf(ORDER);
    assert.notEqual(declared, -1, `${name} uses @layer but never declares "${ORDER}"`);
    assert.ok(declared < block, `${name} declares the layer order after its first @layer block`);
  }
});
