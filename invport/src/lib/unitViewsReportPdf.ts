import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UnitViewSummary } from './unitViewStats';
import type { UnitViewsReportRow, ViewMetric } from './unitViewsReport';

export function createUnitViewsPdf(
  rows: readonly UnitViewsReportRow[],
  summary: UnitViewSummary,
  metric: ViewMetric,
  metricLabel: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const margin = 32;
  doc.setFontSize(18);
  doc.text('Inventory Website Views Report', margin, 38);
  doc.setFontSize(10);
  doc.text(`Snapshot: ${summary.generatedAt} | Time zone: ${summary.timeZone}`, margin, 57);
  doc.text('Current inventory only. Detail-page views, not unique visitors.', margin, 73);
  const totals = rows.reduce((total, row) => total + row[metric], 0);
  doc.text(`${metricLabel}: ${totals.toLocaleString('en-US')} views across ${rows.length} units`, margin, 92);
  doc.setFontSize(13);
  doc.text(`Top 10 units - ${metricLabel}`, margin, 119);
  const top = rows.filter((row) => row[metric] > 0).slice(0, 10);
  const max = Math.max(1, ...top.map((row) => row[metric]));
  if (!top.length) {
    doc.setFontSize(10);
    doc.text('No views recorded for this period.', margin, 145);
  }
  top.forEach((row, index) => {
    const y = 141 + index * 28;
    doc.setFontSize(9);
    const label = `${row.stock || `Unit ${row.unitId}`} - ${row.name}`;
    doc.text(doc.splitTextToSize(label, 250)[0], margin, y + 10);
    doc.setFillColor(71, 85, 105);
    const width = (row[metric] / max) * 350;
    doc.rect(295, y, width, 16, 'F');
    doc.text(row[metric].toLocaleString('en-US'), 652, y + 11);
  });
  doc.addPage();
  autoTable(doc, {
    startY: 60,
    margin: { top: 60, bottom: 35, left: margin, right: margin },
    head: [['Unit', 'Stock #', 'Inventory item', 'VIN', 'Status', 'Month', '7 days', 'Lifetime']],
    body: rows.map((row) => [
      row.unitId, row.stock, row.name, row.vin, row.status,
      row.monthViews, row.last7DaysViews, row.lifetimeViews,
    ]),
    styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: [71, 85, 105] },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
    didDrawPage: () => {
      doc.setFontSize(12);
      doc.text(`All current inventory - ranked by ${metricLabel}`, margin, 35);
    },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`Page ${page} of ${pages}`, 760, 592, { align: 'right' });
  }
  return doc;
}
