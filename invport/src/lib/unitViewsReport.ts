import type { Vehicle } from '@/types';
import type { UnitViewStats, UnitViewSummary } from './unitViewStats';

export type ViewMetric = 'monthViews' | 'last7DaysViews' | 'lifetimeViews';
export const VIEW_METRIC_LABELS: Record<ViewMetric, string> = {
  monthViews: 'This month',
  last7DaysViews: 'Last 7 days',
  lifetimeViews: 'Lifetime',
};

export interface UnitViewsReportRow {
  unitId: number;
  stock: string;
  name: string;
  vin: string;
  status: string;
  monthViews: number;
  last7DaysViews: number;
  lifetimeViews: number;
}

export function buildUnitViewsReport(
  inventory: readonly Vehicle[],
  summary: UnitViewSummary,
  metric: ViewMetric,
): UnitViewsReportRow[] {
  const byId = new Map<number, UnitViewStats>(summary.units.map((unit) => [unit.unitId, unit]));
  return inventory.map((unit) => {
    const unitId = unit.unitId ?? Number(unit.id);
    if (!Number.isInteger(unitId) || unitId <= 0) throw new Error('Cannot report views: inventory has an invalid UnitID');
    const views = byId.get(unitId);
    return {
      unitId,
      stock: unit.stock ?? '',
      name: `${unit.year} ${unit.make} ${unit.model}`.trim(),
      vin: unit.vin,
      status: unit.status,
      monthViews: views?.monthViews ?? 0,
      last7DaysViews: views?.last7DaysViews ?? 0,
      lifetimeViews: views?.lifetimeViews ?? 0,
    };
  }).sort((a, b) => b[metric] - a[metric] || a.unitId - b.unitId);
}

export function reportViewTotals(rows: readonly UnitViewsReportRow[]) {
  return rows.reduce((totals, row) => ({
    monthViews: totals.monthViews + row.monthViews,
    last7DaysViews: totals.last7DaysViews + row.last7DaysViews,
    lifetimeViews: totals.lifetimeViews + row.lifetimeViews,
  }), { monthViews: 0, last7DaysViews: 0, lifetimeViews: 0 });
}
