const { BlobServiceClient } = require('@azure/storage-blob');

function json(status, body) {
  return { status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function sanitizeVin(vin) {
  return String(vin || '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function parseBaseUrl(baseUrl) {
  try {
    const u = new URL(baseUrl);
    const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean);
    const container = parts[0] || 'invpics';
    const prefix = parts.slice(1).join('/');
    return { container, prefix: prefix ? prefix + '/' : '' };
  } catch {
    return { container: 'invpics', prefix: 'units/' };
  }
}

function getImageBaseUrl() {
  const envBase = getEnv('IMGBaseURL', getEnv('NEXT_PUBLIC_IMG_BASE_URL', 'https://storageinventoryflatt.blob.core.windows.net/invpics/units/'));
  return envBase.endsWith('/') ? envBase : envBase + '/';
}

module.exports = async function (context, req) {
  const vinRaw = (req.params && req.params.vin) || '';
  const vin = sanitizeVin(vinRaw);
  const start = Date.now();

  if (!vin) {
    context.res = json(400, { success: false, error: 'VIN is required' });
    return;
  }

  const baseUrl = getImageBaseUrl();
  const { container, prefix } = parseBaseUrl(baseUrl);
  const conn = getEnv('AZURE_STORAGE_CONNECTION_STRING', '');

  if (!conn) {
    context.res = json(500, { success: false, error: 'Storage connection not configured' });
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
    const containerClient = blobServiceClient.getContainerClient(container);

    // Check if any blobs exist under prefix+VIN/
    let exists = false;
    const listPrefix = `${prefix}${vin}/`;
    for await (const _ of containerClient.listBlobsFlat({ prefix: listPrefix })) {
      exists = true;
      break;
    }

    if (!exists) {
      // Create a placeholder blob to materialize the directory
      const keepPath = `${listPrefix}.keep`;
      const blockBlob = containerClient.getBlockBlobClient(keepPath);
      await blockBlob.uploadData(Buffer.from(''), { blobHTTPHeaders: { blobContentType: 'text/plain' } });
    }

    context.res = json(200, {
      success: true,
      created: !exists,
      container,
      path: `${listPrefix}`,
      responseTimeMs: Date.now() - start,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    context.log.error('ensureVinFolder error:', err);
    context.res = json(500, { success: false, error: err.message || 'Unknown error' });
  }
};
