'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { viewTrend } from '@/lib/unitViewStats';

interface ViewTrendIndicatorProps {
  current: number;
  previous: number;
  /** e.g. "same point last month" */
  comparisonLabel: string;
  size?: 'small' | 'medium';
}

export default function ViewTrendIndicator({ current, previous, comparisonLabel, size = 'small' }: ViewTrendIndicatorProps) {
  const trend = viewTrend(current, previous);
  if (current === 0 && previous === 0) return null;
  const up = trend.direction === 'up' || trend.direction === 'new';
  const color = up ? 'success.main' : trend.direction === 'down' ? 'error.main' : 'text.secondary';
  const Icon = up ? ArrowUpwardIcon : trend.direction === 'down' ? ArrowDownwardIcon : TrendingFlatIcon;
  const text = trend.direction === 'new' ? 'New' : trend.percent === null ? '0%' : `${trend.percent > 0 ? '+' : ''}${trend.percent}%`;
  const fontSize = size === 'small' ? '0.75rem' : '0.875rem';

  return (
    <Tooltip title={`${previous.toLocaleString()} view${previous === 1 ? '' : 's'} ${comparisonLabel}`}>
      <Box
        component="span"
        aria-label={`${text} vs ${comparisonLabel}`}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color, fontWeight: 600, fontSize, lineHeight: 1 }}
      >
        <Icon sx={{ fontSize: size === 'small' ? 14 : 18 }} />
        {text}
      </Box>
    </Tooltip>
  );
}
