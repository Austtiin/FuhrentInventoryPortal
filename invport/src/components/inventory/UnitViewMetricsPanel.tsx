'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsIcon from '@mui/icons-material/Insights';
import ViewTrendIndicator from '@/components/inventory/ViewTrendIndicator';
import { useUnitViewStats } from '@/hooks/useUnitViewStats';

function Metric({ label, value, trend }: { label: string; value: string; trend?: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>{value}</Typography>
        {trend}
      </Box>
    </Box>
  );
}

/** Month-to-date, lifetime and 7-day website views for a single unit. */
export default function UnitViewMetricsPanel({ unitId }: { unitId: number | null | undefined }) {
  const { data, error, isLoading, isRefreshing, refresh } = useUnitViewStats(unitId);
  const stats = data?.stats;

  if (!unitId) return null;

  return (
    <Box
      component="section"
      aria-label="Website views"
      aria-busy={isRefreshing}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsightsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>Website views</Typography>
        </Box>
        <Tooltip title="Refresh view stats">
          <span>
            <IconButton size="small" onClick={() => void refresh()} disabled={isRefreshing} aria-label="Refresh view stats">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ height: 2, mb: 1 }}>{isRefreshing && <LinearProgress sx={{ height: 2 }} />}</Box>

      {error && !stats ? (
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => void refresh()}>Retry</Button>}>
          {error}
        </Alert>
      ) : isLoading || !stats ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i}><Skeleton width="60%" /><Skeleton width="40%" height={32} /></Box>
          ))}
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Metric
              label="This month"
              value={stats.monthViews.toLocaleString()}
              trend={<ViewTrendIndicator current={stats.monthViews} previous={stats.previousMonthViews} comparisonLabel="at this point last month" />}
            />
            <Metric label="Lifetime" value={stats.lifetimeViews.toLocaleString()} />
            <Metric
              label="Last 7 days"
              value={stats.last7DaysViews.toLocaleString()}
              trend={<ViewTrendIndicator current={stats.last7DaysViews} previous={stats.previous7DaysViews} comparisonLabel="in the previous 7 days" />}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {stats.lastViewedAt ? `Last viewed ${new Date(stats.lastViewedAt).toLocaleString()}` : 'Not viewed on the website yet'}
            {' · '}Detail-page views, not unique visitors
          </Typography>
          {error && (
            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
              {error}. Showing the last loaded stats.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
