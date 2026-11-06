/**
 * Unit page-view stats (dbo.UnitViews) served by the inventory API:
 *   GET /api/unit-views/summary     -> every viewed unit + inventory totals
 *   GET /api/units/{UnitID}/view-stats -> one unit
 * Counts are website detail-page views, not unique visitors.
 * "Month" is month-to-date in the dealership's time zone; "previousMonth" is the
 * same elapsed slice of last month so trend arrows compare like with like.
 */

export interface UnitViewStats {
  unitId: number;
  lifetimeViews: number;
  monthViews: number;
  previousMonthViews: number;
  last7DaysViews: number;
  previous7DaysViews: number;
  lastViewedAt: string | null;
}

export interface UnitViewSummary {
  generatedAt: string;
  timeZone: string;
  totals: UnitViewStats;
  units: UnitViewStats[];
}

export interface UnitViewStatsResponse {
  generatedAt: string;
  timeZone: string;
  stats: UnitViewStats;
}

export type TrendDirection = 'up' | 'down' | 'flat' | 'new';

export interface ViewTrend {
  direction: TrendDirection;
  change: number;
  percent: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const count = (value: unknown, field: string): number => {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid unit view response: ${field}`);
  return n;
};

export function parseUnitViewStats(value: unknown): UnitViewStats {
  if (!isRecord(value)) throw new Error('Invalid unit view response: stats');
  const unitId = count(value.unitId, 'unitId');
  return {
    unitId,
    lifetimeViews: count(value.lifetimeViews, 'lifetimeViews'),
    monthViews: count(value.monthViews, 'monthViews'),
    previousMonthViews: count(value.previousMonthViews, 'previousMonthViews'),
    last7DaysViews: count(value.last7DaysViews, 'last7DaysViews'),
    previous7DaysViews: count(value.previous7DaysViews, 'previous7DaysViews'),
    lastViewedAt: typeof value.lastViewedAt === 'string' ? value.lastViewedAt : null,
  };
}

export function parseUnitViewSummary(value: unknown): UnitViewSummary {
  if (!isRecord(value) || !Array.isArray(value.units)) throw new Error('Invalid unit view response: summary');
  return {
    generatedAt: String(value.generatedAt ?? ''),
    timeZone: String(value.timeZone ?? ''),
    totals: parseUnitViewStats(value.totals),
    units: value.units.map(parseUnitViewStats),
  };
}

export function parseUnitViewStatsResponse(value: unknown): UnitViewStatsResponse {
  if (!isRecord(value)) throw new Error('Invalid unit view response: stats');
  return {
    generatedAt: String(value.generatedAt ?? ''),
    timeZone: String(value.timeZone ?? ''),
    stats: parseUnitViewStats(value.stats),
  };
}

export function emptyUnitViewStats(unitId: number): UnitViewStats {
  return { unitId, lifetimeViews: 0, monthViews: 0, previousMonthViews: 0, last7DaysViews: 0, previous7DaysViews: 0, lastViewedAt: null };
}

export function sortByUnitViews<T extends { id: string; unitId?: number }>(
  units: readonly T[],
  stats: ReadonlyMap<number, UnitViewStats>,
  metric: 'monthViews' | 'lifetimeViews',
  order: 'asc' | 'desc',
): T[] {
  const views = (unit: T) => stats.get(unit.unitId ?? Number(unit.id))?.[metric] ?? 0;
  return [...units].sort((a, b) => {
    const difference = views(a) - views(b);
    return (order === 'asc' ? difference : -difference) ||
      (Number(a.unitId ?? a.id) - Number(b.unitId ?? b.id)) || a.id.localeCompare(b.id);
  });
}

export function viewTrend(current: number, previous: number): ViewTrend {
  const change = current - previous;
  if (previous === 0) return { direction: current > 0 ? 'new' : 'flat', change, percent: null };
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    change,
    percent: Math.round((change / previous) * 100),
  };
}

export interface ViewLeaders {
  mostPopular: UnitViewStats | null;
  hottest: UnitViewStats | null;
}

/**
 * Most popular = most month-to-date views. Hottest = most views in the last 7 days.
 * Restrict to units the portal can display by passing their IDs.
 */
export function pickViewLeaders(units: UnitViewStats[], eligibleUnitIds?: ReadonlySet<number>): ViewLeaders {
  const pool = eligibleUnitIds ? units.filter((u) => eligibleUnitIds.has(u.unitId)) : units;
  const best = (score: (u: UnitViewStats) => number, tie: (u: UnitViewStats) => number) =>
    pool.reduce<UnitViewStats | null>((top, u) => {
      if (score(u) <= 0) return top;
      if (!top || score(u) > score(top) || (score(u) === score(top) && tie(u) > tie(top))) return u;
      return top;
    }, null);
  return {
    mostPopular: best((u) => u.monthViews, (u) => u.last7DaysViews),
    hottest: best((u) => u.last7DaysViews, (u) => u.monthViews),
  };
}
