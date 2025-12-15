'use client';

import React, { useState } from 'react';
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
import { LoadingSpinner } from '@/components/ui/Loading';
import { SingleVehicleImage } from '@/components/inventory/SingleVehicleImage';
import { Vehicle } from '@/types';

interface CompactInventoryCardProps {
  item: Vehicle;
  onView?: (item: Vehicle) => void; // Made optional since we're using Link navigation
  onEdit: (item: Vehicle) => void;
  onMarkAsPending: (item: Vehicle) => void;
  onMarkAsAvailable: (item: Vehicle) => void;
  onMarkAsSold: (item: Vehicle) => void;
  onShowNotification?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
  enableImageLoading?: boolean;
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

export default function CompactInventoryCard({
  item,
  onView,
  onEdit,
  onMarkAsPending,
  onMarkAsAvailable,
  onMarkAsSold,
  onShowNotification,
  enableImageLoading = true
}: CompactInventoryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const statusConfig = getStatusConfig(item.status);

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

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
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: 6,
        borderColor: 'grey.300',
      },
    }}
  >
      {/* Image Section */}
      <Box sx={{ position: 'relative', height: 192, bgcolor: 'grey.100' }}>
        {enableImageLoading ? (
          <SingleVehicleImage 
            vin={item.vin}
            typeId={item.typeId || 2}
            unitId={item.unitId ?? (Number.isFinite(Number(item.id)) ? Number(item.id) : undefined)}
            className="w-full h-full"
            lazy={true}
            onClickImage={() => onEdit(item)}
          />
        ) : (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            bgcolor: 'grey.200', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <LoadingSpinner size="md" />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Loading image...
            </Typography>
          </Box>
        )}
        
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
      </Box>

      {/* Content Section */}
  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Vehicle Title */}
        <Typography variant="h6" component="h3" fontWeight={700} gutterBottom sx={{ 
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
            <Box component="span" fontWeight={500}>VIN:</Box>{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {item.vin}
            </Box>
          </Typography>
          
          {item.mileage && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <Box component="span" fontWeight={500}>Mileage:</Box>{' '}
              {item.mileage?.toLocaleString()} miles
            </Typography>
          )}
          
          {item.color && (
            <Typography variant="body2" color="text.secondary">
              <Box component="span" fontWeight={500}>Color:</Box>{' '}
              {item.color}
            </Typography>
          )}
        </Box>

        {/* Price + MSRP */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" component="p" color="success.main" fontWeight={700} sx={{ m: 0 }}>
              {formatPrice(item.price)}
            </Typography>
            {typeof item.msrp === 'number' && !Number.isNaN(item.msrp) && (
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                MSRP: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.msrp)}
              </Typography>
            )}
          </Box>
        </Box>

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

