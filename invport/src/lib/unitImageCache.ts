export interface UnitImage {
  name: string;
  url: string;
  number: number;
}

export function parseUnitImages(value: unknown, version?: number): UnitImage[] {
  if (!Array.isArray(value)) throw new Error('Invalid image list response');
  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object' || !('name' in item) || !('url' in item) ||
        typeof item.name !== 'string' || typeof item.url !== 'string') {
      throw new Error('Invalid image list entry');
    }
    const match = item.name.match(/^(\d+)\.(png|jpg|jpeg|webp|gif)$/i);
    return {
      name: item.name,
      url: version === undefined ? item.url : `${item.url}${item.url.includes('?') ? '&' : '?'}_cb=${version}`,
      number: match ? Number(match[1]) : 0,
    };
  }).filter((image) => image.number > 0).sort((a, b) => a.number - b.number);
}

/** Share image lists across cards/gallery mounts and bound simultaneous list requests. */
export function createUnitImageCache(load: (id: string, version?: number) => Promise<UnitImage[]>) {
  const entries = new Map<string, { images: UnitImage[]; expires: number }>();
  const pending = new Map<string, Promise<UnitImage[]>>();
  const versions = new Map<string, number>();
  const queue: Array<() => void> = [];
  let active = 0;
  let revision = Date.now();

  const peek = (id: string) => entries.get(id)?.images;
  const get = (id: string, force = false): Promise<UnitImage[]> => {
    const cached = entries.get(id);
    if (!force && cached && cached.expires > Date.now()) return Promise.resolve(cached.images);
    if (!force && pending.has(id)) return pending.get(id)!;
    if (force) {
      versions.delete(id);
      versions.set(id, ++revision);
      if (versions.size > 200) versions.delete(versions.keys().next().value!);
    }
    const version = versions.get(id);
    const request = new Promise<UnitImage[]>((resolve, reject) => {
      const run = () => {
        active++;
        void load(id, version).then(resolve, reject).finally(() => {
          active--;
          queue.shift()?.();
        });
      };
      if (active < 4) run();
      else queue.push(run);
    });
    pending.set(id, request);
    void request.then((images) => {
      if (pending.get(id) !== request) return;
      entries.delete(id);
      entries.set(id, { images, expires: Date.now() + 5 * 60 * 1000 });
      if (entries.size > 200) entries.delete(entries.keys().next().value!);
    }, () => {
      // Keep the previous successful image list when a background request fails.
    }).finally(() => {
      if (pending.get(id) === request) pending.delete(id);
    });
    return request;
  };
  const invalidate = (id: string) => {
    entries.delete(id);
    pending.delete(id);
    versions.delete(id);
    versions.set(id, ++revision);
    if (versions.size > 200) versions.delete(versions.keys().next().value!);
  };
  return { peek, get, invalidate };
}
