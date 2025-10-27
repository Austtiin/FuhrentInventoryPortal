'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { useReportsData } from '@/hooks/useReportsData';
import { 
  DocumentArrowDownIcon, 
  CurrencyDollarIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { apiFetchJson } from '@/lib/apiClient';

const ReportsPage: React.FC = () => {
  // const [dateRange, setDateRange] = useState('7');
  const { data: reportsData, isLoading, error, lastUpdated, refresh } = useReportsData();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get dynamic stats from real data
  const getStatsData = () => {
    if (!reportsData || !reportsData.totalStats) return [];
    
    const totalStats = reportsData.totalStats;
    
    return [
      {
        title: 'Total Inventory Value',
        value: formatCurrency(totalStats.totalValue || 0),
        icon: CurrencyDollarIcon,
      },
      {
        title: 'Total Vehicles',
        value: (totalStats.totalVehicles || 0).toString(),
        icon: CubeIcon,
      },
      {
        title: 'Total Fish Houses',
        value: (totalStats.totalFishHouses || 0).toString(),
        icon: BuildingStorefrontIcon,
      },
      {
        title: 'Total Trailers',
        value: (totalStats.totalTrailers || 0).toString(),
        icon: CubeIcon,
      },
      {
        title: 'Unique Makes',
        value: (totalStats.uniqueMakes || 0).toString(),
        icon: BuildingStorefrontIcon,
      },
      {
        title: 'Pending Sales',
        value: (totalStats.pendingSales || 0).toString(),
        icon: ArrowTrendingUpIcon,
      },
    ];
  };

  const statsData = getStatsData();

  // Export helpers for Available Reports quick buttons
  type InvItem = {
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
  };

  const [isExporting, setIsExporting] = useState(false);

  const fetchInventoryAll = async (): Promise<InvItem[]> => {
    const res = await apiFetchJson<unknown>('/GrabInventoryAll');
    if (Array.isArray(res)) return res as InvItem[];
    const r = res as { data?: unknown; vehicles?: unknown };
    if (Array.isArray(r.data)) return r.data as InvItem[];
    if (Array.isArray(r.vehicles)) return r.vehicles as InvItem[];
    return [];
  };

  const toCsv = (rows: Record<string, unknown>[]) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map(h => esc((row as Record<string, unknown>)[h])).join(','));
    return lines.join('\n');
  };

  const saveBlob = (content: BlobPart, filename: string, type = 'application/octet-stream') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    {
      title: 'Inventory Summary Report',
      description: 'Comprehensive overview of all inventory items with current values and status',
      format: ['PDF', 'Excel', 'CSV'],
    },
  ];

  const generateReport = async (reportType: string, format: string) => {
    if (reportType !== 'Inventory Summary Report') return;
    try {
      setIsExporting(true);
      const items = await fetchInventoryAll();
      const rows = items.map(i => ({
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

      const formatCurrency = (n?: number) =>
        typeof n === 'number'
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
          : '';

      if (format === 'CSV') {
        const csv = toCsv(rows.map(r => ({ ...r, Price: typeof r.Price === 'number' ? r.Price : '' })));
        saveBlob(csv, 'inventory-summary.csv', 'text/csv;charset=utf-8');
        return;
      }

      if (format === 'Excel') {
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({ ...r, Price: typeof r.Price === 'number' ? r.Price : '' })));
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const cells = ws as unknown as Record<string, XLSX.CellObject>;
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
          const header = cells[headerCell]?.v as string | number | undefined;
          if (header === 'Price') {
            for (let R = 1; R <= range.e.r; ++R) {
              const addr = XLSX.utils.encode_cell({ r: R, c: C });
              const cell = cells[addr];
              if (cell && typeof cell.v === 'number') cell.z = '"$"#,##0';
            }
          }
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveBlob(wbout, 'inventory-summary.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return;
      }

      if (format === 'PDF') {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
        const margin = 28; // slightly tighter margins to fit content
        const headerFontSize = 10; // smaller header text to reduce clipping
        const cellFontSize = 8; // smaller table text to fit more per line
        const line = 14; // reduced row height
        const cellPad = 2;
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const contentW = pageW - margin * 2; // available width

        type Row = typeof rows[number];
        // Column widths revised to fit within content width (avoid clipping)
        // Use proportional widths to fully utilize the page width (larger space for Make/Model/VIN)
        const colDefs: { key: keyof Row; label: string; weight: number; align?: 'left' | 'right' }[] = [
          { key: 'UnitID', label: 'UnitID', weight: 0.06, align: 'left' },
          { key: 'StockNo', label: 'Stock #', weight: 0.08, align: 'left' },
          { key: 'Year', label: 'Year', weight: 0.06, align: 'left' },
          { key: 'Make', label: 'Make', weight: 0.14, align: 'left' },
          { key: 'Model', label: 'Model', weight: 0.20, align: 'left' },
          { key: 'VIN', label: 'VIN', weight: 0.26, align: 'left' },
          { key: 'Status', label: 'Status', weight: 0.07, align: 'right' },
          { key: 'Condition', label: 'Condition', weight: 0.07, align: 'right' },
          { key: 'Price', label: 'Price', weight: 0.06, align: 'right' },
        ];
        // Convert to absolute widths based on available content width
        const cols = colDefs.map(d => ({ key: d.key, label: d.label, width: Math.floor(d.weight * contentW), align: d.align }));

        const drawHeader = (yHeader: number) => {
          let x = margin;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(headerFontSize);
          for (const c of cols) { 
            const hx = c.align === 'right' ? x + c.width - cellPad : x + cellPad;
            doc.text(c.label, hx, yHeader, c.align === 'right' ? { align: 'right' } : undefined);
            x += c.width; 
          }
          doc.setLineWidth(0.5);
          doc.line(margin, yHeader + 4, margin + cols.reduce((s, c) => s + c.width, 0), yHeader + 4);
        };

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Fuhre Enteprise Dealership Inventory Summary', margin, margin);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, margin + 14);

        // Table
        let y = margin + 40;
        drawHeader(y);
        y += line;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(cellFontSize);

        // Helper: fit text to cell width with ellipsis using jsPDF measurement
        const fitText = (text: string, maxWidth: number) => {
          if (!text) return '';
          let t = text;
          const ellipsis = '…';
          // quick accept
          if (doc.getTextWidth(t) <= maxWidth) return t;
          // trim until fits
          while (t.length > 0 && doc.getTextWidth(t + ellipsis) > maxWidth) {
            t = t.slice(0, -1);
          }
          return t.length ? t + ellipsis : '';
        };

        let sumPrice = 0;
        for (const r of rows) {
          let x = margin;
          // Page-break if needed (reserve space for bottom summary ~ 4 lines)
          if (y > pageH - margin - line * 4) {
            doc.addPage();
            y = margin + 20;
            drawHeader(y);
            y += line;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(cellFontSize);
          }
          for (const c of cols) {
            const raw = r[c.key];
            if (c.key === 'Price' && typeof raw === 'number') sumPrice += raw;
            const v = c.key === 'Price' && typeof raw === 'number' ? formatCurrency(raw) : String(raw ?? '');
            const maxW = c.width - cellPad * 2;
            const text = fitText(v, maxW);
            if (c.align === 'right') {
              const rx = x + c.width - cellPad; // right edge inside cell
              doc.text(text, rx, y, { align: 'right' });
            } else {
              const lx = x + cellPad; // left edge with padding
              doc.text(text, lx, y);
            }
            x += c.width;
          }
          y += line;
        }

        // Bottom-right totals (follow the price totals)
        const totalUnits = rows.length;
        const totalsYStart = Math.min(pageH - margin - line * 3, y + line);
        const rightX = pageW - margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Totals', rightX, totalsYStart, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Total Units: ${totalUnits}`, rightX, totalsYStart + line, { align: 'right' });
        doc.text(`Total Price: ${formatCurrency(sumPrice)}`, rightX, totalsYStart + line * 2, { align: 'right' });

        // Open printable view instead of downloading
        try {
          // Embed auto-print instruction in PDF; supported by most PDF viewers
          if (typeof (doc as unknown as { autoPrint?: () => void }).autoPrint === 'function') {
            (doc as unknown as { autoPrint: () => void }).autoPrint();
          }
          const blobUrl = doc.output('bloburl');
          window.open(blobUrl, '_blank');
        } catch {
          // Fallback: data URL new window
          const dataUrl = doc.output('dataurlstring');
          window.open(dataUrl, '_blank');
        }
        return;
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into your inventory performance and metrics
              {lastUpdated && (
                <span className="text-sm text-gray-500 block mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowTrendingUpIcon className="w-5 h-5" />
              <span className="text-white">{isLoading ? 'Loading...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Reports Data</h2>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button 
              onClick={() => refresh()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !reportsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Overview - Made Smaller */}
        {!isLoading && reportsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {statsData.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-600">{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Sections - More Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Category Breakdown</h3>
                <div className="space-y-2">
                  {reportsData.categoryBreakdown && reportsData.categoryBreakdown.length > 0 ? (
                    reportsData.categoryBreakdown.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{category.count} units</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(category.totalValue)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No category data available</p>
                  )}
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Inventory Summary</h3>
                <div className="space-y-2">
                  {reportsData.totalStats && (
                    <>
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Total Units</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(reportsData.totalStats.totalVehicles || 0) + 
                           (reportsData.totalStats.totalFishHouses || 0) + 
                           (reportsData.totalStats.totalTrailers || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 pl-4">• Vehicles (TypeID 2)</span>
                        <span className="text-sm text-gray-900">
                          {reportsData.totalStats.totalVehicles || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 pl-4">• Fish Houses (TypeID 1)</span>
                        <span className="text-sm text-gray-900">
                          {reportsData.totalStats.totalFishHouses || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 pb-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600 pl-4">• Trailers (TypeID 3)</span>
                        <span className="text-sm text-gray-900">
                          {reportsData.totalStats.totalTrailers || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 mt-2">
                        <span className="text-sm font-medium text-gray-700">Total Value</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(reportsData.totalStats.totalValue || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">Average Price</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(reportsData.totalStats.avgPrice || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">Price Range</span>
                        <span className="text-sm text-gray-900">
                          {formatCurrency(reportsData.totalStats.minPrice || 0)} - {formatCurrency(reportsData.totalStats.maxPrice || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">Average Year</span>
                        <span className="text-sm text-gray-900">
                          {Math.round(reportsData.totalStats.avgYear || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">Year Range</span>
                        <span className="text-sm text-gray-900">
                          {reportsData.totalStats.oldestYear || 'N/A'} - {reportsData.totalStats.newestYear || 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

  {/* Available Reports Section - shortcuts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Available Reports</h2>
            <p className="text-gray-600 mt-1">Generate detailed reports in various formats</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportTypes.slice(0, 2).map((report, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                    </div>
                    <DocumentArrowDownIcon className="w-5 h-5 text-gray-400 shrink-0 ml-3" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {report.format.map((format) => (
                      <button
                        key={format}
                        onClick={() => generateReport(report.title, format)}
                        disabled={isLoading || isExporting}
                        className="px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                      >
                        Generate {format}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;

