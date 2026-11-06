'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Skeleton from '@mui/material/Skeleton';
import { LoadingSpinner } from '@/components/ui/Loading';
import { SingleVehicleImage } from '@/components/inventory/SingleVehicleImage';
import ViewTrendIndicator from '@/components/inventory/ViewTrendIndicator';
import { Vehicle } from '@/types';
import { formatMileage, formatPrice } from '@/lib/format';
import type { UnitViewStats } from '@/lib/unitViewStats';

interface CompactInventoryCardProps {
  item: Vehicle;
  onView?: (item: Vehicle) => void; // Made optional since we're using Link navigation
  onEdit: (item: Vehicle) => void;
  onMarkAsPending: (item: Vehicle) => void;
  onMarkAsAvailable: (item: Vehicle) => void;
  onMarkAsSold: (item: Vehicle) => void;
  onShowNotification?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
  /** Website view stats; omit to hide the views row. null = loaded with no views. */
  viewStats?: UnitViewStats | null;
  viewStatsLoading?: boolean;
  viewBadges?: { hottest?: boolean; mostPopular?: boolean };
  hottest?: boolean;
  mostPopular?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return { 
        color: 'success' as const,
        label: 'Available'
      };
    case 'sold':
      return { 
        color: 'error' as const,
        label: 'Sold'
      };
    case 'pending':
      return { 
        color: 'warning' as const,
        label: 'Pending'
      };
    default:
      return { 
        color: 'default' as const,
        label: status || 'Unknown'
      };
  }
};

function CompactInventoryCard({
  item,
  onView,
  onEdit,
  onMarkAsPending,
  onMarkAsAvailable,
  onMarkAsSold,
  onShowNotification,
  viewStats,
  viewStatsLoading = false,
  viewBadges,
  hottest = false,
  mostPopular = false,
}: CompactInventoryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const statusConfig = getStatusConfig(item.status);


  const handleStatusChange = async (action: 'pending' | 'available' | 'sold') => {
    console.log(`🎯 CompactInventoryCard: handleStatusChange called with action: ${action} for vehicle: ${item.id}`);
    if (isLoading) return;
    setIsLoading(true);
    try {
      switch (action) {
        case 'pending':
          console.log(`📞 Calling onMarkAsPending for vehicle: ${item.id}`);
          await onMarkAsPending(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as pending`);
          break;
        case 'available':
          console.log(`📞 Calling onMarkAsAvailable for vehicle: ${item.id}`);
          await onMarkAsAvailable(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as available`);
          break;
        case 'sold':
          console.log(`📞 Calling onMarkAsSold for vehicle: ${item.id}`);
          await onMarkAsSold(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as sold`);
          break;
      }
    } catch (error) {
      console.error(`❌ CompactInventoryCard: Error in handleStatusChange:`, error);
      onShowNotification?.('error', 'Error', 'Failed to update vehicle status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <Card 
    sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      '&:hover': {
        boxShadow: 1,
        borderColor: 'grey.300',
      },
    }}
  >
      {/* Image Section */}
      <Box sx={{ position: 'relative', height: 192, bgcolor: 'grey.100' }}>
        <SingleVehicleImage 
          unitId={item.unitId ?? (Number.isFinite(Number(item.id)) ? Number(item.id) : undefined)}
          preloadedImages={item.images}
          className="w-full h-full"
          lazy
          onClickImage={() => onEdit(item)}
        />
        
        {/* Status Badge Overlay */}
        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
          <Chip 
            label={statusConfig.label} 
            color={statusConfig.color}
            size="small"
            sx={{ fontWeight: 600, boxShadow: 2 }}
          />
        </Box>
        
        {/* Stock Number Overlay */}
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Chip 
            label={`#${item.stock}`}
            size="small"
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.7)', 
              color: 'white',
              fontWeight: 500,
            }}
          />
        </Box>

        {(hottest || mostPopular || viewBadges?.hottest || viewBadges?.mostPopular) && (
          <Box sx={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(hottest || viewBadges?.hottest) && (
              <Chip
                icon={<LocalFireDepartmentIcon sx={{ color: 'inherit !important' }} />}
                label="Hottest right now"
                size="small"
                sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 600, boxShadow: 2 }}
              />
            )}
            {(mostPopular || viewBadges?.mostPopular) && (
              <Chip
                icon={<EmojiEventsIcon sx={{ color: 'inherit !important' }} />}
                label="Most popular this month"
                size="small"
                sx={{ bgcolor: 'warning.main', color: 'white', fontWeight: 600, boxShadow: 2 }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Content Section */}
  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Vehicle Title */}
        <Typography variant="h6" component="h3" gutterBottom sx={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: 56,
        }}>
          {item.year} {item.make} {item.model}
        </Typography>

        {/* Vehicle Details */}
        <Box sx={{ mb: 2, flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Box component="span" sx={{ fontWeight: 500 }}>VIN:</Box>{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {item.vin}
            </Box>
          </Typography>
          
          {typeof item.mileage === 'number' && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <Box component="span" sx={{ fontWeight: 500 }}>Mileage:</Box>{' '}
              {formatMileage(item.mileage)}
            </Typography>
          )}
          
          {item.color && (
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 500 }}>Color:</Box>{' '}
              {item.color}
            </Typography>
          )}
        </Box>

        {/* Price + MSRP */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="p" color="text.primary" sx={{ m: 0, fontWeight: 600 }}>
              {formatPrice(item.price)}
            </Typography>
            {typeof item.msrp === 'number' && !Number.isNaN(item.msrp) && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                MSRP: {formatPrice(item.msrp)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Website views */}
        {(viewStats !== undefined || viewStatsLoading) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary', minHeight: 20 }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
            {viewStatsLoading && viewStats === undefined ? (
              <Skeleton width={140} />
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" title={`${(viewStats?.lifetimeViews ?? 0).toLocaleString()} lifetime views`}>
                  {(viewStats?.monthViews ?? 0).toLocaleString()} view{viewStats?.monthViews === 1 ? '' : 's'} this month
                </Typography>
                <ViewTrendIndicator
                  current={viewStats?.monthViews ?? 0}
                  previous={viewStats?.previousMonthViews ?? 0}
                  comparisonLabel="at this point last month"
                />
              </>
            )}
          </Box>
        )}

        {/* Action Buttons Row (View + Status) */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {onView ? (
            <Button
              onClick={() => onView(item)}
              variant="contained"
              startIcon={<VisibilityIcon />}
              sx={{ flex: 1, minWidth: 0 }}
            >
              View
            </Button>
          ) : (
            <Button
              component={Link}
              href={`/inventory/vehicle?id=${item.id || item.unitId}`}
              variant="contained"
              startIcon={<VisibilityIcon />}
              sx={{ flex: 1, minWidth: 0 }}
            >
              View
            </Button>
          )}

          {/* Conditional Status Buttons */}
          {item.status?.toLowerCase() === 'available' && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ BUTTON CLICKED: Mark as Pending for vehicle:', item.id);
                handleStatusChange('pending');
              }}
              disabled={isLoading}
              variant="contained"
              color="warning"
              startIcon={isLoading ? undefined : <AccessTimeIcon />}
              sx={{ flex: 1, minWidth: 0 }}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Mark Pending'}
            </Button>
          )}

          {item.status?.toLowerCase() === 'pending' && (
            <ButtonGroup variant="contained" sx={{ flex: 1 }}>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ BUTTON CLICKED: Mark as Available for vehicle:', item.id);
                  handleStatusChange('available');
                }}
                disabled={isLoading}
                color="success"
                size="small"
                sx={{ flex: 1, fontSize: '0.75rem', px: 1 }}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Mark Available'}
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ BUTTON CLICKED: Mark as Sold for vehicle:', item.id);
                  handleStatusChange('sold');
                }}
                disabled={isLoading}
                color="error"
                size="small"
                sx={{ flex: 1, fontSize: '0.75rem', px: 1 }}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Mark Sold'}
              </Button>
            </ButtonGroup>
          )}

          {item.status?.toLowerCase() === 'sold' && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ BUTTON CLICKED: Mark as Available for vehicle:', item.id);
                handleStatusChange('available');
              }}
              disabled={isLoading}
              variant="contained"
              color="success"
              startIcon={isLoading ? undefined : <CheckCircleIcon />}
              sx={{ flex: 1, minWidth: 0 }}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Mark Available'}
            </Button>
          )}
        </Box>

        {/* Edit Button - Full width at bottom */}
        <Button
          onClick={() => onEdit(item)}
          variant="outlined"
          color="inherit"
          startIcon={<EditIcon />}
          fullWidth
        >
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}

export default memo(CompactInventoryCard);
