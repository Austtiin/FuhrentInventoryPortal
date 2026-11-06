'use client';

import { useMemo } from 'react';
import { LoadingSpinner } from '@/components/ui/Loading';
import {
  buildUnitViewsReport, reportViewTotals, VIEW_METRIC_LABELS, type ViewMetric,
} from '@/lib/unitViewsReport';
import type { UnitViewSummary } from '@/lib/unitViewStats';
import type { Vehicle } from '@/types';

interface Props {
  inventory: Vehicle[] | null;
  summary: UnitViewSummary | null;
  metric: ViewMetric;
  onMetricChange: (metric: ViewMetric) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export default function UnitViewsReport({
  inventory, summary, metric, onMetricChange, isLoading, isRefreshing, error,
}: Props) {
  const report = useMemo(() => {
    if (!inventory || !summary) return null;
    try {
      const rows = buildUnitViewsReport(inventory, summary, metric);
      return { rows, totals: reportViewTotals(rows), error: null };
    } catch (err) {
      console.error('Could not build views report:', err);
      return { rows: [], totals: null, error: err instanceof Error ? err.message : 'Unable to build views report' };
    }
  }, [inventory, summary, metric]);
  const top = report?.rows.filter((row) => row[metric] > 0).slice(0, 10) ?? [];
  const max = Math.max(1, ...top.map((row) => row[metric]));

  return (
    <section aria-labelledby="views-report-title" className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 id="views-report-title" className="text-xl font-bold text-gray-900">Website views report</h2>
          <p className="text-sm text-gray-600 mt-1">Current inventory only. Detail-page views, not unique visitors.</p>
        </div>
        <label className="text-sm font-medium text-gray-900">
          View period
          <select
            value={metric}
            onChange={(event) => onMetricChange(event.target.value as ViewMetric)}
            className="ml-2 rounded border border-gray-300 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {Object.entries(VIEW_METRIC_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {(error || report?.error) && <p role="alert" className="mb-4 text-sm text-red-700">Could not update views report: {error || report?.error}. Use Refresh Data to retry.</p>}
      {isLoading && !report && <div role="status" className="flex items-center gap-2 py-8 text-gray-600"><LoadingSpinner size="sm" /> Loading views report...</div>}
      {isRefreshing && report && <p role="status" className="mb-3 text-sm text-gray-600">Updating views in the background...</p>}
      {report?.totals && (
        <>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 mb-6 tabular-nums">
            {Object.entries(VIEW_METRIC_LABELS).map(([key, label]) => (
              <div key={key}><dt className="text-sm text-gray-600">{label}</dt><dd className="text-lg font-semibold text-gray-900">{report.totals![key as ViewMetric].toLocaleString()}</dd></div>
            ))}
          </dl>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Top 10 units - {VIEW_METRIC_LABELS[metric]}</h3>
          {!top.length ? <p className="py-6 text-sm text-gray-600">{report.rows.length ? 'No views recorded for this period.' : 'No inventory units to report.'}</p> : (
            <figure aria-label={`Top inventory by ${VIEW_METRIC_LABELS[metric].toLowerCase()} views`}>
              <div className="space-y-3">
                {top.map((row) => (
                  <div key={row.unitId}>
                    <div className="flex items-baseline justify-between gap-3 mb-1 text-sm">
                      <span className="text-gray-800">{row.stock ? `#${row.stock}` : `Unit ${row.unitId}`} - {row.name}</span>
                      <span className="shrink-0 font-semibold text-gray-900 tabular-nums">{row[metric].toLocaleString()} views</span>
                    </div>
                    <div className="h-4 bg-slate-100" aria-hidden="true">
                      <div className="h-full bg-slate-600" style={{ width: `${(row[metric] / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <figcaption className="mt-4 text-xs text-gray-600">Bars share a scale from 0 to {max.toLocaleString()} views. PDF includes the graph and every current inventory unit.</figcaption>
            </figure>
          )}
          <p className="mt-4 text-xs text-gray-600">Snapshot: {summary?.generatedAt} ({summary?.timeZone}). Month means month-to-date in the dealership time zone.</p>
        </>
      )}
    </section>
  );
}
