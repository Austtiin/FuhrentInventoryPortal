import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildUnitViewsReport, reportViewTotals } from '../src/lib/unitViewsReport.ts';
import { createUnitViewsPdf } from '../src/lib/unitViewsReportPdf.ts';

const inventory = Array.from({ length: 80 }, (_, index) => ({
  id: String(index + 1), unitId: index + 1, stock: `STOCK${index + 1}`,
  year: 2026, make: 'Aluma-Lite', model: `Model ${index + 1}`, vin: `VIN${index + 1}`, status: 'available',
}));
const summary = {
  generatedAt: '2026-11-05T20:00:00Z', timeZone: 'America/Chicago',
  units: [
    { unitId: 1, monthViews: 7, last7DaysViews: 3, lifetimeViews: 100 },
    { unitId: 2, monthViews: 12, last7DaysViews: 1, lifetimeViews: 20 },
    { unitId: 999, monthViews: 500, last7DaysViews: 500, lifetimeViews: 500 },
  ],
};

test('view reports rank selected period, include zero-view inventory and exclude non-inventory units', () => {
  const rows = buildUnitViewsReport(inventory, summary, 'monthViews');
  assert.equal(rows.length, 80);
  assert.deepEqual(rows.slice(0, 3).map((row) => row.unitId), [2, 1, 3]);
  assert.deepEqual(reportViewTotals(rows), { monthViews: 19, last7DaysViews: 4, lifetimeViews: 120 });
  assert.equal(buildUnitViewsReport(inventory, summary, 'last7DaysViews')[0].unitId, 1);
  assert.equal(buildUnitViewsReport(inventory, summary, 'lifetimeViews')[0].unitId, 1);
  assert.deepEqual(buildUnitViewsReport([], summary, 'monthViews'), []);
  assert.throws(() => buildUnitViewsReport([{ id: 'invalid' }], summary, 'monthViews'), /invalid UnitID/);
});

test('views PDF contains a vector graph, metadata and every unit across paginated tables', () => {
  const rows = buildUnitViewsReport(inventory, summary, 'monthViews');
  const doc = createUnitViewsPdf(rows, summary, 'monthViews', 'This month');
  const pdf = doc.output();
  assert.ok(doc.getNumberOfPages() >= 3);
  for (const text of ['Inventory Website Views Report', 'Top 10 units', 'America/Chicago', 'Month', '7 days', 'Lifetime', 'STOCK80', 'VIN80']) {
    assert.ok(pdf.includes(text), `PDF includes ${text}`);
  }
  assert.ok(pdf.includes(' re\nf'), 'graph has filled vector rectangles');
});

test('zero-view and empty reports export without invented measurements', () => {
  for (const rows of [[], buildUnitViewsReport(inventory, { ...summary, units: [] }, 'monthViews')]) {
    assert.ok(createUnitViewsPdf(rows, summary, 'monthViews', 'This month').output().includes('No views recorded'));
  }
});
