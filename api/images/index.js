// Azure Function: images/{vin}
// Supports: GET (list/single), POST (upload), DELETE (delete+compact), PATCH (reorder)
// Requires: AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER (optional, will derive from IMGBaseURL), IMGBaseURL (for public URLs)

const { BlobServiceClient } = require('@azure/storage-blob');

// Helpers
function json(status, body) {
  return { status, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function parseBaseUrl(baseUrl) {
  try {
    const u = new URL(baseUrl);
    // path like /invpics/units/
    const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean);
    const container = parts[0] || 'invpics';
    const prefixParts = parts.slice(1);
    const prefix = prefixParts.length ? prefixParts.join('/') + '/' : '';
    return { container, prefix, origin: `${u.protocol}//${u.host}` };
  } catch {
    return { container: 'invpics', prefix: 'units/', origin: 'https://storage.blob.core.windows.net' };
  }
}

function getImageBaseUrl() {
  const envBase = getEnv('IMGBaseURL', getEnv('NEXT_PUBLIC_IMG_BASE_URL', 'https://storageinventoryflatt.blob.core.windows.net/invpics/units/'));
  return envBase.endsWith('/') ? envBase : envBase + '/';
}

function sanitizeVin(vin) {
  return String(vin || '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function detectExtensionFromMime(mime) {
  if (!mime) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'png';
}

function buildPublicUrl(baseUrl, vin, number, ext) {
  const clean = baseUrl.replace(/\/$/, '');
  return `${clean}/${vin}/${number}.${ext}`;
}

async function listImages(containerClient, prefix, vin) {
  const imageRegex = new RegExp(`^${prefix}${vin}/(\\d+)\\.(png|jpg|jpeg|webp|gif)$`, 'i');
  const results = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix: `${prefix}${vin}/` })) {
    const m = blob.name.match(imageRegex);
    if (m) {
      results.push({
        name: blob.name,
        number: parseInt(m[1], 10),
        ext: m[2].toLowerCase(),
        size: blob.properties.contentLength || 0,
        etag: blob.properties.etag || undefined,
      });
    }
  }
  results.sort((a, b) => a.number - b.number);
  return results;
}

async function downloadToBuffer(blobClient) {
  const download = await blobClient.download();
  const chunks = [];
  for await (const chunk of download.readableStreamBody) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase();
  const vinRaw = req.params.vin;
  const vin = sanitizeVin(vinRaw);

  if (!vin) {
    context.res = json(400, { success: false, error: 'VIN is required' });
    return;
  }

  const baseUrl = getImageBaseUrl();
  const { container: derivedContainer, prefix } = parseBaseUrl(baseUrl);
  const containerName = getEnv('AZURE_STORAGE_CONTAINER', derivedContainer);
  const conn = getEnv('AZURE_STORAGE_CONNECTION_STRING', '');

  let containerClient = null;
  if (conn) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }

  try {
    if (method === 'GET') {
      const single = (req.query?.single || '').toString().toLowerCase() === 'true';
      let items = [];

      if (containerClient) {
        const blobs = await listImages(containerClient, prefix, vin);
        items = blobs.map(b => ({
          name: b.name,
          number: b.number,
          url: buildPublicUrl(baseUrl, vin, b.number, b.ext),
        }));
      } else {
        // Fallback: probe first up to 20 with png/jpg/jpeg
        const exts = ['png', 'jpg', 'jpeg'];
        for (let i = 1; i <= 20; i++) {
          let found = false;
          for (const ext of exts) {
            const url = buildPublicUrl(baseUrl, vin, i, ext);
            try {
              const head = await fetch(url, { method: 'HEAD' });
              if (head.ok) {
                items.push({ name: `${prefix}${vin}/${i}.${ext}`, number: i, url });
                found = true; break;
              }
            } catch {}
          }
          if (!found && single) break;
        }
      }

      if (single) {
        if (items.length === 0) {
          context.res = { status: 404, body: 'Not found' };
          return;
        }
        context.res = json(200, { success: true, images: [items[0]] });
      } else {
        context.res = json(200, { success: true, images: items });
      }
      return;
    }

    if (method === 'POST') {
      if (!containerClient) {
        context.res = json(500, { success: false, error: 'Storage not configured for uploads' });
        return;
      }

      // Parse multipart form-data
      const contentType = req.headers['content-type'] || req.headers['Content-Type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        context.res = json(400, { success: false, error: 'multipart/form-data required' });
        return;
      }

      // Lazy import busboy (dependency in api/package.json)
      const Busboy = require('busboy');
      const bb = Busboy({ headers: req.headers });
      const files = [];
      const done = new Promise((resolve, reject) => {
        bb.on('file', (name, file, info) => {
          const chunks = [];
          file.on('data', d => chunks.push(d));
          file.on('limit', () => reject(new Error('File too large')));
          file.on('end', () => {
            files.push({ filename: info.filename, mimeType: info.mimeType, buffer: Buffer.concat(chunks) });
          });
        });
        bb.on('error', reject);
        bb.on('finish', resolve);
      });

      // The Azure Functions v4 node worker provides rawBody/ body stream via req
      const bodyBuffer = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody || req.body || '');
      bb.end(bodyBuffer);
      await done;

      if (files.length === 0) {
        context.res = json(400, { success: false, error: 'No file uploaded' });
        return;
      }

      // Determine next number
      const blobs = await listImages(containerClient, prefix, vin);
      const nextNum = (blobs[blobs.length - 1]?.number || 0) + 1;
      const file = files[0];
      const ext = (file.filename?.split('.').pop() || detectExtensionFromMime(file.mimeType)).toLowerCase();
      const blobPath = `${prefix}${vin}/${nextNum}.${ext}`;
      const blobClient = containerClient.getBlockBlobClient(blobPath);
      await blobClient.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimeType || 'application/octet-stream' } });

      context.res = json(200, { success: true });
      return;
    }

    if (method === 'DELETE') {
      if (!containerClient) {
        context.res = json(500, { success: false, error: 'Storage not configured for deletions' });
        return;
      }
      const imageNumber = parseInt((req.query?.imageNumber || '').toString(), 10);
      if (!imageNumber || imageNumber < 1) {
        context.res = json(400, { success: false, error: 'imageNumber query param required' });
        return;
      }

      const blobs = await listImages(containerClient, prefix, vin);
      const target = blobs.find(b => b.number === imageNumber);
      if (!target) {
        context.res = json(404, { success: false, error: 'Image not found' });
        return;
      }
      // Delete target
      await containerClient.deleteBlob(target.name);

      // Compact numbering to 1..N
      const remaining = (await listImages(containerClient, prefix, vin));
      // If already compact, nothing to do
      let needsCompact = remaining.some((b, idx) => b.number !== idx + 1);
      if (needsCompact) {
        // First move to temp names to avoid collisions
        for (const b of remaining) {
          const src = containerClient.getBlockBlobClient(b.name);
          const tmpPath = `${prefix}${vin}/tmp_${b.number}.${b.ext}`;
          const tmp = containerClient.getBlockBlobClient(tmpPath);
          const buf = await downloadToBuffer(src);
          await tmp.uploadData(buf, { blobHTTPHeaders: { blobContentType: `image/${b.ext === 'jpg' ? 'jpeg' : b.ext}` } });
          await src.delete();
        }
        // Move from temp to final sequential
        let idx = 1;
        for await (const blob of containerClient.listBlobsFlat({ prefix: `${prefix}${vin}/tmp_` })) {
          const tmpClient = containerClient.getBlockBlobClient(blob.name);
          const m = blob.name.match(new RegExp(`^${prefix}${vin}/tmp_(\\d+)\\.(png|jpg|jpeg|webp|gif)$`, 'i'));
          const ext = (m && m[2] ? m[2].toLowerCase() : 'png');
          const finalPath = `${prefix}${vin}/${idx}.${ext}`;
          const finalClient = containerClient.getBlockBlobClient(finalPath);
          const buf = await downloadToBuffer(tmpClient);
          await finalClient.uploadData(buf, { blobHTTPHeaders: { blobContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` } });
          await tmpClient.delete();
          idx++;
        }
      }

      context.res = json(200, { success: true });
      return;
    }

    if (method === 'PATCH') {
      if (!containerClient) {
        context.res = json(500, { success: false, error: 'Storage not configured for reordering' });
        return;
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const newOrder = Array.isArray(body.newOrder) ? body.newOrder.map(n => parseInt(n, 10)).filter(n => n > 0) : null;
      if (!newOrder || newOrder.length === 0) {
        context.res = json(400, { success: false, error: 'newOrder array required' });
        return;
      }

      const blobs = await listImages(containerClient, prefix, vin);
      // Map by current number
      const byNumber = new Map(blobs.map(b => [b.number, b]));
      // Phase 1: copy all to temp_{position}
      for (let i = 0; i < newOrder.length; i++) {
        const currentNum = newOrder[i];
        const srcMeta = byNumber.get(currentNum);
        if (!srcMeta) continue;
        const src = containerClient.getBlockBlobClient(srcMeta.name);
        const tmpPath = `${prefix}${vin}/tmp_${i + 1}.${srcMeta.ext}`;
        const tmp = containerClient.getBlockBlobClient(tmpPath);
        const buf = await downloadToBuffer(src);
        await tmp.uploadData(buf, { blobHTTPHeaders: { blobContentType: `image/${srcMeta.ext === 'jpg' ? 'jpeg' : srcMeta.ext}` } });
      }
      // Phase 2: delete originals
      for (const b of blobs) {
        await containerClient.deleteBlob(b.name);
      }
      // Phase 3: move temp to final 1..N
      for await (const blob of containerClient.listBlobsFlat({ prefix: `${prefix}${vin}/tmp_` })) {
        const tmpClient = containerClient.getBlockBlobClient(blob.name);
        const m = blob.name.match(new RegExp(`^${prefix}${vin}/tmp_(\\d+)\\.(png|jpg|jpeg|webp|gif)$`, 'i'));
        const pos = m ? parseInt(m[1], 10) : null;
        const ext = (m && m[2] ? m[2].toLowerCase() : 'png');
        if (!pos) continue;
        const finalPath = `${prefix}${vin}/${pos}.${ext}`;
        const finalClient = containerClient.getBlockBlobClient(finalPath);
        const buf = await downloadToBuffer(tmpClient);
        await finalClient.uploadData(buf, { blobHTTPHeaders: { blobContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` } });
        await tmpClient.delete();
      }

      context.res = json(200, { success: true });
      return;
    }

    context.res = json(405, { success: false, error: 'Method not allowed' });
  } catch (err) {
    context.log.error('Image function error', err);
    context.res = json(500, { success: false, error: err.message || 'Internal Server Error' });
  }
};
