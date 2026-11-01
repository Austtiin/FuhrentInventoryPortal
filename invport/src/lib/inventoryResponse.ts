import type { Vehicle } from '@/types';

export function inventoryRecords(result: unknown): Record<string, unknown>[] {
  const records: unknown[] | null = Array.isArray(result)
    ? result
    : result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)
      ? result.data
      : result && typeof result === 'object' && 'vehicles' in result && Array.isArray(result.vehicles)
        ? result.vehicles
        : null;
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!records || !records.every(isRecord)) throw new Error('Invalid inventory response');
  return records;
}

export function normalizeInventoryVehicle(record: Record<string, unknown>): Vehicle {
  const fields = Object.fromEntries(Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]));
  const id = String(fields.unitid ?? fields.id ?? '');
  const unitId = Number(id);
  const year = Number(fields.year ?? 0);
  const make = String(fields.make ?? '');
  const model = String(fields.model ?? '');
  const images = fields.images ?? fields.photos;
  return {
    id,
    unitId: Number.isFinite(unitId) && unitId > 0 ? unitId : undefined,
    name: `${year} ${make} ${model}`.trim(),
    year,
    make,
    model,
    vin: String(fields.vin ?? ''),
    price: Number(fields.price ?? fields.msrp ?? 0),
    msrp: fields.msrp == null ? undefined : Number(fields.msrp),
    mileage: Number(fields.mileage ?? fields.miles ?? 0),
    stock: fields.stockno == null && fields.stock == null ? undefined : String(fields.stockno ?? fields.stock),
    typeId: Number(fields.typeid ?? 2),
    status: String(fields.status ?? 'available').toLowerCase() as Vehicle['status'],
    color: String(fields.color ?? ''),
    category: (fields.category == null ? 'SUV' : String(fields.category)) as Vehicle['category'],
    transmission: String(fields.transmission ?? 'Automatic') as Vehicle['transmission'],
    fuelType: String(fields.fueltype ?? 'Gasoline') as Vehicle['fuelType'],
    description: String(fields.description ?? fields.notes ?? ''),
    images: Array.isArray(images) ? images.map(String) : [],
    dateAdded: String(fields.createdat ?? fields.created_at ?? new Date().toISOString()),
    lastUpdated: String(fields.updatedat ?? fields.updated_at ?? new Date().toISOString()),
    location: String(fields.location ?? 'Main Lot'),
    dealer: String(fields.dealer ?? 'Flatt Motors'),
    engine: fields.engine == null ? undefined : String(fields.engine),
    drivetrain: fields.drivetrain == null ? undefined : String(fields.drivetrain),
    bodyStyle: fields.bodystyle == null ? undefined : String(fields.bodystyle),
    condition: fields.condition == null ? undefined : String(fields.condition),
    banner: fields.banner == null ? undefined : String(fields.banner),
  };
}
