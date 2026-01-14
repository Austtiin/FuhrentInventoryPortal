// Azure Function: GET /units/{id}/images
// Purpose: List all images for a unit (by UnitID), sorted numerically by filename.
// Implementation: Looks up VIN for the given UnitID, then lists images from blob storage
// using the same conventions as the /images/{vin} function.

const { BlobServiceClient } = require('@azure/storage-blob');
const { executeQuery } = require('../shared/database');

function json(status, body) {
  return { status, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

function parseBaseUrl(baseUrl) {
  try {
    const u = new URL(baseUrl);
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
      });
    }
  }
  results.sort((a, b) => a.number - b.number);
  return results;
}

function buildPublicUrl(baseUrl, vin, number, ext) {
  const clean = baseUrl.replace(/\/$/, '');
  return `${clean}/${vin}/${number}.${ext}`;
}

module.exports = async function (context, req) {
  const idRaw = req.params.id;
  const unitId = parseInt(idRaw, 10);

  if (!Number.isFinite(unitId) || unitId <= 0) {
    context.res = json(400, {
      error: true,
      message: 'Invalid UnitID format. Must be a positive number.',
      statusCode: 400
    });
    return;
  }

  try {
    // Look up VIN for this UnitID
    const result = await executeQuery('SELECT VIN FROM dbo.Units WHERE UnitID = @id', { id: unitId });
    if (!result.success) {
      throw new Error(result.error || 'Failed to query database');
    }
    const rows = result.data || [];
    if (rows.length === 0 || !rows[0].VIN) {
      context.res = json(404, {
        error: true,
        message: 'Unit not found',
        statusCode: 404
      });
      return;
    }

    const vin = sanitizeVin(rows[0].VIN);
    if (!vin) {
      context.res = json(400, {
        error: true,
        message: 'Invalid VIN for unit',
        statusCode: 400
      });
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

    let items = [];

    if (containerClient) {
      const blobs = await listImages(containerClient, prefix, vin);
      items = blobs.map(b => ({
        name: `${b.number}.${b.ext}`,
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
              items.push({ name: `${i}.${ext}`, url });
              found = true;
              break;
            }
          } catch {}
        }
      }
    }

    context.res = json(200, items);
  } catch (err) {
    context.log.error('Unit images function error', err);
    context.res = json(500, {
      error: true,
      message: err.message || 'Internal Server Error',
      statusCode: 500
    });
  }
};
