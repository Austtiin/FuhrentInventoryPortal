import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function worker(fetch) {
  const handlers = {};
  const entries = new Map();
  const deleted = [];
  const cache = {
    match: async (request) => entries.get(request.url)?.clone(),
    put: async (request, response) => { entries.set(request.url, response); },
    keys: async () => [...entries.keys()].map((url) => ({ url })),
    delete: async (request) => entries.delete(request.url),
  };
  runInNewContext(source, {
    URL, console, fetch,
    self: { addEventListener: (event, handler) => { handlers[event] = handler; }, skipWaiting() {}, clients: { claim: async () => {} } },
    caches: { open: async () => cache, delete: async (name) => { deleted.push(name); } },
  });
  const request = async (url) => {
    const background = [];
    let response;
    handlers.fetch({
      request: { url, destination: 'image' },
      respondWith: (promise) => { response = promise; },
      waitUntil: (promise) => { background.push(promise); },
    });
    return { response: await response, background };
  };
  return { request, entries, handlers, deleted };
}

test('image worker serves cached images immediately and revalidates in the background', async () => {
  let release;
  let calls = 0;
  const sw = worker(async () => {
    calls++;
    if (calls > 1) await new Promise((resolve) => { release = resolve; });
    return new Response(`image version ${calls}`);
  });
  const url = 'https://example.blob.core.windows.net/unit/1.webp';
  assert.equal(await (await sw.request(url)).response.text(), 'image version 1');
  const warm = await sw.request(url);
  assert.equal(await warm.response.text(), 'image version 1', 'does not wait for background network');
  release();
  await Promise.all(warm.background);
  assert.equal(await sw.entries.get(url).clone().text(), 'image version 2');
});

test('image worker bounds storage and does not intercept non-blob images', async () => {
  const sw = worker(async () => new Response('image'));
  for (let index = 0; index < 205; index++) {
    await sw.request(`https://example.blob.core.windows.net/unit/${index}.webp`);
  }
  assert.equal(sw.entries.size, 200);
  const other = await sw.request('https://example.test/image.webp');
  assert.equal(other.response, undefined);
});

test('image worker surfaces initial network failure and clears only its old named cache', async () => {
  const sw = worker(async () => { throw new Error('Network offline'); });
  await assert.rejects(sw.request('https://example.blob.core.windows.net/1.webp'), /Network offline/);
  let activated;
  sw.handlers.activate({ waitUntil: (promise) => { activated = promise; } });
  await activated;
  assert.deepEqual(sw.deleted, ['blob-image-cache-v2']);
});
