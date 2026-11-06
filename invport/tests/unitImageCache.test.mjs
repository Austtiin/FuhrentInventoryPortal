import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createUnitImageCache, parseUnitImages } from '../src/lib/unitImageCache.ts';

const imageList = [{ name: '1.webp', url: 'https://example.test/1.webp' }];

test('image lists retain stable URLs, sort numerically and version only intentional refreshes', () => {
  const list = parseUnitImages([
    { name: '10.webp', url: 'https://example.test/10.webp?token=test' },
    ...imageList,
    { name: 'notes.txt', url: 'https://example.test/notes.txt' },
  ]);
  assert.deepEqual(list.map((image) => image.number), [1, 10]);
  assert.equal(list[0].url, imageList[0].url);
  assert.equal(parseUnitImages(imageList, 42)[0].url, `${imageList[0].url}?_cb=42`);
  assert.throws(() => parseUnitImages({}), /Invalid image list/);
  assert.throws(() => parseUnitImages([{}]), /Invalid image list/);
});

test('cards and galleries share in-flight and cached lists; refresh and mutation invalidate correctly', async () => {
  const versions = [];
  const cache = createUnitImageCache(async (id, version) => {
    versions.push(version);
    return parseUnitImages(imageList, version);
  });
  const [card, gallery] = await Promise.all([cache.get('1'), cache.get('1')]);
  assert.strictEqual(card, gallery);
  await cache.get('1');
  assert.equal(versions.length, 1, 'one request across repeated mounts');
  assert.equal(versions[0], undefined);
  const refreshed = await cache.get('1', true);
  assert.match(refreshed[0].url, /_cb=/);
  assert.strictEqual(await cache.get('1'), refreshed);
  cache.invalidate('1');
  assert.equal(cache.peek('1'), undefined);
  const changed = await cache.get('1');
  assert.notEqual(changed[0].url, refreshed[0].url);
});

test('many inventory cards never exceed four concurrent list requests', async () => {
  let active = 0;
  let maxActive = 0;
  const cache = createUnitImageCache(async () => {
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return parseUnitImages(imageList);
  });
  await Promise.all(Array.from({ length: 60 }, (_, index) => cache.get(String(index))));
  assert.equal(maxActive, 4);
  assert.equal(active, 0);
});

test('failed background loads reject explicitly and retain previous successful images', async () => {
  let fail = false;
  const cache = createUnitImageCache(async () => {
    if (fail) throw new Error('Network unavailable');
    return parseUnitImages(imageList);
  });
  const initial = await cache.get('1');
  fail = true;
  await assert.rejects(cache.get('1', true), /Network unavailable/);
  assert.strictEqual(cache.peek('1'), initial);
});

test('an invalidated in-flight response cannot overwrite newer images', async () => {
  let release;
  const cache = createUnitImageCache(async (id, version) => {
    if (version === undefined) await new Promise((resolve) => { release = resolve; });
    return parseUnitImages(imageList, version);
  });
  const old = cache.get('1');
  cache.invalidate('1');
  const fresh = await cache.get('1');
  release();
  await old;
  assert.strictEqual(cache.peek('1'), fresh);
});

test('expired lists refresh after five minutes and the cache retains at most 200 units', async (t) => {
  let now = 1000;
  let requests = 0;
  t.mock.method(Date, 'now', () => now);
  const cache = createUnitImageCache(async () => {
    requests++;
    return parseUnitImages(imageList);
  });
  await cache.get('1');
  now += 299999;
  await cache.get('1');
  assert.equal(requests, 1);
  now++;
  await cache.get('1');
  assert.equal(requests, 2);
  await Promise.all(Array.from({ length: 200 }, (_, index) => cache.get(String(index + 2))));
  assert.equal(cache.peek('1'), undefined);
  assert.ok(cache.peek('201'));
});
