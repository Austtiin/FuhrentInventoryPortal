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
import ButtonBase from '@mui/material/ButtonBase';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsIcon from '@mui/icons-material/Insights';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ViewTrendIndicator from '@/components/inventory/ViewTrendIndicator';
import type { UnitViewStats, UnitViewSummary, ViewLeaders } from '@/lib/unitViewStats';
import type { Vehicle } from '@/types';

interface UnitViewStatsBarProps {
  summary: UnitViewSummary | null;
  leaders: ViewLeaders;
  vehiclesByUnitId: Map<number, Vehicle>;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

const tileSx = {
  p: 2,
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  minWidth: 0,
  textAlign: 'left' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  gap: 0.5,
};

function LeaderTile({ title, icon, stats, vehicle, metric, current, previous, comparisonLabel, onSelect }: {
  title: string;
  icon: React.ReactNode;
  stats: UnitViewStats | null;
  vehicle: Vehicle | undefined;
  metric: string;
  current: number;
  previous: number;
  comparisonLabel: string;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
      {icon}
      <Typography variant="overline" sx={{ lineHeight: 1.5 }}>{title}</Typography>
    </Box>
  );
  if (!stats || !vehicle) {
    return (
      <Box sx={tileSx}>
        {header}
        <Typography variant="body2" color="text.secondary">No views yet</Typography>
      </Box>
    );
  }
  return (
    <ButtonBase onClick={() => onSelect(vehicle)} sx={{ ...tileSx, '&:hover': { borderColor: 'primary.main' } }}>
      {header}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          {vehicle.stock ? `#${vehicle.stock} · ` : ''}{current.toLocaleString()} {metric}
        </Typography>
        <ViewTrendIndicator current={current} previous={previous} comparisonLabel={comparisonLabel} />
      </Box>
    </ButtonBase>
  );
}

export default function UnitViewStatsBar({
  summary,
  leaders,
  vehiclesByUnitId,
  isLoading,
  isRefreshing,
  error,
  lastUpdated,
  onRefresh,
  onSelectVehicle,
}: UnitViewStatsBarProps) {
  const totals = summary?.totals;
  const popular = leaders.mostPopular;
  const hottest = leaders.hottest;

  return (
    <Box component="section" aria-label="Website view stats" aria-busy={isRefreshing} sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InsightsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>Website views</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" role="status">
            {isRefreshing ? 'Updating…' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
          </Typography>
          <Tooltip title="Refresh view stats">
            <span>
              <IconButton size="small" onClick={onRefresh} disabled={isRefreshing} aria-label="Refresh view stats">
                <RefreshIcon fontSize="small" sx={isRefreshing ? { animation: 'spin 1s linear infinite', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } } : undefined} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ height: 2, mb: 1 }}>{isRefreshing && !isLoading && <LinearProgress sx={{ height: 2 }} />}</Box>

      {error && !summary ? (
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={onRefresh}>Retry</Button>}>
          {error}. Inventory is still available.
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {isLoading || !totals ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={tileSx}>
                <Skeleton width="45%" />
                <Skeleton width="70%" height={28} />
                <Skeleton width="55%" />
              </Box>
            ))
          ) : (
            <>
              <Box sx={tileSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <VisibilityOutlinedIcon fontSize="small" />
                  <Typography variant="overline" sx={{ lineHeight: 1.5 }}>Views this month</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{totals.monthViews.toLocaleString()}</Typography>
                  <ViewTrendIndicator current={totals.monthViews} previous={totals.previousMonthViews} comparisonLabel="at this point last month" size="medium" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {totals.lifetimeViews.toLocaleString()} lifetime · {totals.last7DaysViews.toLocaleString()} last 7 days
                </Typography>
              </Box>
              <LeaderTile
                title="Most popular this month"
                icon={<EmojiEventsIcon fontSize="small" sx={{ color: 'warning.main' }} />}
                stats={popular}
                vehicle={popular ? vehiclesByUnitId.get(popular.unitId) : undefined}
                metric="views this month"
                current={popular?.monthViews ?? 0}
                previous={popular?.previousMonthViews ?? 0}
                comparisonLabel="at this point last month"
                onSelect={onSelectVehicle}
              />
              <LeaderTile
                title="Hottest right now"
                icon={<LocalFireDepartmentIcon fontSize="small" sx={{ color: 'error.main' }} />}
                stats={hottest}
                vehicle={hottest ? vehiclesByUnitId.get(hottest.unitId) : undefined}
                metric="views in 7 days"
                current={hottest?.last7DaysViews ?? 0}
                previous={hottest?.previous7DaysViews ?? 0}
                comparisonLabel="in the previous 7 days"
                onSelect={onSelectVehicle}
              />
            </>
          )}
        </Box>
      )}
      {error && summary && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          {error}. Showing the last loaded stats.
        </Typography>
      )}
    </Box>
  );
}
