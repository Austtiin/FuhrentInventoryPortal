'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { RadarChart } from '@mui/x-charts/RadarChart';

interface InventoryRadarChartProps {
  totalVehicles: number;
  totalFishHouses: number;
  totalTrailers: number;
}

export const InventoryRadarChart: React.FC<InventoryRadarChartProps> = ({
  totalVehicles,
  totalFishHouses,
  totalTrailers,
}) => {
  const total = totalVehicles + totalFishHouses + totalTrailers;

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
        Inventory Type Comparison
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <RadarChart
          height={350}
          series={[
            {
              label: 'Inventory Count',
              data: [totalVehicles, totalFishHouses, totalTrailers],
              color: '#3b82f6',
              highlightScope: { highlight: 'item', fade: 'global' },
            },
          ]}
          radar={{
            max: total,
            metrics: ['Vehicles', 'Fish Houses', 'Trailers'],
          }}
          sx={{
            '& .MuiRadarChart-radar': {
              strokeWidth: 3,
              fillOpacity: 0.4,
            },
            '& .MuiChartsAxis-tickLabel': {
              fontSize: '14px',
              fontWeight: 600,
              fill: '#111827',
            },
            '& .MuiChartsAxis-line': {
              stroke: '#9ca3af',
              strokeWidth: 1.5,
            },
            '& .MuiChartsAxis-tick': {
              stroke: '#d1d5db',
              strokeWidth: 1,
            },
          }}
        />

        {/* Summary stats */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'divider',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Total Inventory
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {total}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Vehicles
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalVehicles}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Fish Houses
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalFishHouses}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Trailers
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {totalTrailers}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
