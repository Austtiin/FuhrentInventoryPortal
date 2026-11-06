import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseUnitViewStatsResponse,
  parseUnitViewSummary,
  pickViewLeaders,
  viewTrend,
  sortByUnitViews,
} from '../src/lib/unitViewStats.ts';

const unit = (unitId, monthViews, last7DaysViews, extra = {}) => ({
  unitId, lifetimeViews: monthViews + 10, monthViews, previousMonthViews: 0,
  last7DaysViews, previous7DaysViews: 0, lastViewedAt: '2026-11-02T12:00:00Z', ...extra,
});

test('sorts month and lifetime views in both directions, including zero-view units and stable ties', () => {
  const vehicles = [{ id: '3' }, { id: '1', unitId: 1 }, { id: '2' }, { id: '4' }];
  const stats = new Map([
    [1, unit(1, 30, 5, { lifetimeViews: 40 })],
    [2, unit(2, 10, 5, { lifetimeViews: 90 })],
    [3, unit(3, 10, 5, { lifetimeViews: 10 })],
  ]);
  const ids = (metric, order) => sortByUnitViews(vehicles, stats, metric, order).map((v) => v.id);
  assert.deepEqual(ids('monthViews', 'desc'), ['1', '2', '3', '4']);
  assert.deepEqual(ids('monthViews', 'asc'), ['4', '2', '3', '1']);
  assert.deepEqual(ids('lifetimeViews', 'desc'), ['2', '1', '3', '4']);
  assert.deepEqual(ids('lifetimeViews', 'asc'), ['4', '3', '1', '2']);
  assert.deepEqual(vehicles.map((v) => v.id), ['3', '1', '2', '4'], 'does not mutate inventory');
});

test('trend arrows: up, down, flat and new', () => {
  assert.deepEqual(viewTrend(15, 10), { direction: 'up', change: 5, percent: 50 });
  assert.deepEqual(viewTrend(5, 10), { direction: 'down', change: -5, percent: -50 });
  assert.deepEqual(viewTrend(10, 10), { direction: 'flat', change: 0, percent: 0 });
  assert.deepEqual(viewTrend(3, 0), { direction: 'new', change: 3, percent: null });
  assert.deepEqual(viewTrend(0, 0), { direction: 'flat', change: 0, percent: null });
});

test('leaders: most popular by month, hottest by last 7 days, restricted to displayable units', () => {
  const units = [unit(1, 50, 2), unit(2, 20, 9), unit(3, 99, 99), unit(4, 20, 9, { monthViews: 25 })];
  const leaders = pickViewLeaders(units, new Set([1, 2, 4]));
  assert.equal(leaders.mostPopular?.unitId, 1);
  assert.equal(leaders.hottest?.unitId, 4, 'ties on 7-day views break on month views');
  assert.deepEqual(pickViewLeaders([unit(5, 0, 0)]), { mostPopular: null, hottest: null });
});

test('parses API summary and stats payloads and rejects malformed ones', () => {
  const summary = parseUnitViewSummary({
    generatedAt: '2026-11-03T02:42:00Z', timeZone: 'America/Chicago',
    totals: { ...unit(0, 5, 1), lastViewedAt: undefined }, units: [unit(7, 5, 1)],
  });
  assert.equal(summary.units[0].unitId, 7);
  assert.equal(summary.totals.lastViewedAt, null);
  assert.equal(parseUnitViewStatsResponse({ stats: { unitId: 7 } }).stats.lifetimeViews, 0, 'omitted counts default to 0');
  for (const bad of [null, {}, { units: [], totals: null }, { units: [{ unitId: 1, monthViews: -1 }], totals: {} }]) {
    assert.throws(() => parseUnitViewSummary(bad), /Invalid unit view response/);
  }
});
