export function formatPrice(price: number | null | undefined, fallback = 'Price TBD'): string {
  if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) return fallback;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number | null | undefined): string {
  if (typeof mileage !== 'number' || Number.isNaN(mileage) || mileage < 0) return '—';
  return `${Math.round(mileage).toLocaleString()} miles`;
}

export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
