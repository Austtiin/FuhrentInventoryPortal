import type { SheetData } from 'write-excel-file/browser';

export interface InventoryExportRow {
  UnitID: number;
  StockNo: string;
  Year: number | string;
  Make: string;
  Model: string;
  VIN: string;
  Status: string;
  Condition: string;
  Price: number | string;
}

const headers = ['UnitID', 'StockNo', 'Year', 'Make', 'Model', 'VIN', 'Status', 'Condition', 'Price'] as const;

export function createInventoryWorksheet(rows: readonly InventoryExportRow[]): SheetData {
  return [
    headers.map(value => ({ value, type: String, fontWeight: 'bold' })),
    ...rows.map(row => headers.map(header => {
      const value = row[header];
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new TypeError(`Invalid ${header} in inventory export`);
        return { value, type: Number, ...(header === 'Price' ? { format: '"$"#,##0' } : {}) };
      }
      return { value, type: String };
    })),
  ];
}

export function toInventoryCsv(rows: readonly InventoryExportRow[]): string {
  const escape = (value: string | number) => {
    let text = String(value);
    // Quoting alone does not prevent spreadsheet formula execution.
    if (typeof value === 'string' && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) {
      text = `'${text}`;
    }
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(','),
    ...rows.map(row => headers.map(header => escape(row[header])).join(',')),
  ].join('\n');
}

export async function exportInventoryExcel(rows: readonly InventoryExportRow[]): Promise<void> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const blob = await writeXlsxFile(createInventoryWorksheet(rows), { sheet: 'Inventory' }).toBlob();
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-summary.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
