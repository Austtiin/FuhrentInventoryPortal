"use client";

import React, { useMemo } from 'react';
import { apiFetchJson } from '@/lib/apiClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export interface InventoryItem {
  UnitID: number;
  StockNo?: string;
  TypeID?: number;
  Year?: number;
  Make?: string;
  Model?: string;
  VIN?: string;
  Price?: number;
  Status?: string;
  Condition?: string;
}

function useInventoryAll() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchJson<unknown>('/GrabInventoryAll');
      if (Array.isArray(res)) {
        setItems(res as InventoryItem[]);
      } else {
        const r = res as { data?: unknown; vehicles?: unknown };
        const arr = Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.vehicles)
            ? r.vehicles
            : [];
        setItems(arr as InventoryItem[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}

function formatCurrency(n?: number) {
  if (typeof n !== 'number') return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function saveBlob(content: BlobPart, filename: string, type = 'application/octet-stream') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const InventorySummaryReport: React.FC = () => {
  const { items, loading, error, refresh } = useInventoryAll();
  type Row = {
    UnitID: number;
    StockNo: string;
    Year: number | '';
    Make: string;
    Model: string;
    VIN: string;
    Status: string;
    Condition: string;
    Price: number | '';
  };

  const rows: Row[] = useMemo(() => {
    return items.map(i => ({
      UnitID: i.UnitID,
      StockNo: i.StockNo ?? '',
      Year: i.Year ?? '',
      Make: i.Make ?? '',
      Model: i.Model ?? '',
      VIN: i.VIN ?? '',
      Status: (i.Status || '').toString().toLowerCase(),
      Condition: i.Condition ?? '',
      Price: typeof i.Price === 'number' ? i.Price : ''
    }));
  }, [items]);

  const tallies = useMemo(() => {
    const byStatus = new Map<string, number>();
    let total = 0;
    for (const r of rows) {
      total++;
      const s = (r.Status || 'unknown').toString();
      byStatus.set(s, (byStatus.get(s) || 0) + 1);
    }
    const statusList = Array.from(byStatus.entries()).map(([status, count]) => ({ status, count }));
    statusList.sort((a, b) => b.count - a.count);
    return { total, statusList };
  }, [rows]);

  const exportCSV = () => {
    const csvRows = rows.map(r => ({ ...r, Price: typeof r.Price === 'number' ? r.Price : '' }));
    const csv = toCsv(csvRows);
    saveBlob(csv, `inventory-summary.csv`, 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({ ...r, Price: typeof r.Price === 'number' ? r.Price : '' })));
    // Format price column as currency via cell format
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const wsCells = ws as unknown as Record<string, XLSX.CellObject>;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
      const header = wsCells[headerCell]?.v as string | number | undefined;
      if (header === 'Price') {
        for (let R = 1; R <= range.e.r; ++R) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = wsCells[addr];
          if (cell && typeof cell.v === 'number') {
            (cell as XLSX.CellObject).z = '"$"#,##0';
          }
        }
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveBlob(wbout, 'inventory-summary.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const margin = 36;
    const lineHeight = 18;
    const cols: { key: keyof Row; label: string; width: number }[] = [
      { key: 'UnitID', label: 'UnitID', width: 60 },
      { key: 'StockNo', label: 'Stock #', width: 70 },
      { key: 'Year', label: 'Year', width: 50 },
      { key: 'Make', label: 'Make', width: 90 },
      { key: 'Model', label: 'Model', width: 120 },
      { key: 'VIN', label: 'VIN', width: 160 },
      { key: 'Status', label: 'Status', width: 70 },
      { key: 'Condition', label: 'Condition', width: 90 },
      { key: 'Price', label: 'Price', width: 80 },
    ];

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Inventory Summary Report', margin, margin);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 14);

    let y = margin + 40;

    // Table header
    doc.setFont('helvetica', 'bold');
    let x = margin;
    for (const c of cols) {
      doc.text(c.label, x, y);
      x += c.width;
    }
    doc.setLineWidth(0.5);
    doc.line(margin, y + 4, margin + cols.reduce((s, c) => s + c.width, 0), y + 4);

    // Rows
    doc.setFont('helvetica', 'normal');
    y += lineHeight;
    const pageHeight = doc.internal.pageSize.getHeight();
    for (const r of rows) {
      x = margin;
      for (const c of cols) {
        const raw = r[c.key];
        const v = c.key === 'Price' && typeof raw === 'number' ? formatCurrency(raw) : String(raw ?? '');
        const text = v.length > 28 ? v.slice(0, 27) + '…' : v;
        doc.text(text, x, y);
        x += c.width;
      }
      y += lineHeight;
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin + 10;
      }
    }

    // Right-side tallies
    const tallyX = margin + cols.reduce((s, c) => s + c.width, 0) + 30;
    let ty = margin + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Tallies', tallyX, ty);
    ty += 16;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Units: ${tallies.total}`, tallyX, ty); ty += 14;
    for (const s of tallies.statusList) {
      doc.text(`${s.status}: ${s.count}`, tallyX, ty); ty += 14;
    }

    doc.save('inventory-summary.pdf');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inventory Summary Report</h3>
          <p className="text-sm text-gray-600">Spreadsheet-style view of all units with export options</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
          <button onClick={exportCSV} disabled={loading} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">CSV</button>
          <button onClick={exportExcel} disabled={loading} className="px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Excel</button>
          <button onClick={exportPDF} disabled={loading} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">PDF</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-5 overflow-auto border border-gray-200 rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-700">
                <th className="px-3 py-2 border-b">UnitID</th>
                <th className="px-3 py-2 border-b">Stock #</th>
                <th className="px-3 py-2 border-b">Year</th>
                <th className="px-3 py-2 border-b">Make</th>
                <th className="px-3 py-2 border-b">Model</th>
                <th className="px-3 py-2 border-b">VIN</th>
                <th className="px-3 py-2 border-b">Status</th>
                <th className="px-3 py-2 border-b">Condition</th>
                <th className="px-3 py-2 border-b text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.UnitID} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 border-b whitespace-nowrap">{r.UnitID}</td>
                  <td className="px-3 py-2 border-b whitespace-nowrap">{r.StockNo}</td>
                  <td className="px-3 py-2 border-b">{r.Year}</td>
                  <td className="px-3 py-2 border-b">{r.Make}</td>
                  <td className="px-3 py-2 border-b">{r.Model}</td>
                  <td className="px-3 py-2 border-b whitespace-nowrap">{r.VIN}</td>
                  <td className="px-3 py-2 border-b capitalize">{r.Status}</td>
                  <td className="px-3 py-2 border-b">{r.Condition}</td>
                  <td className="px-3 py-2 border-b text-right">{typeof r.Price === 'number' ? formatCurrency(r.Price) : ''}</td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500">No inventory found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:col-span-1">
          <div className="border border-gray-200 rounded-md p-3">
            <h4 className="font-semibold text-gray-900 mb-2">Tallies</h4>
            <div className="flex items-center justify-between text-sm py-1 border-b">
              <span className="text-gray-600">Total Units</span>
              <span className="font-medium">{tallies.total}</span>
            </div>
            <div className="mt-2 space-y-1">
              {tallies.statusList.map(s => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{s.status}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
