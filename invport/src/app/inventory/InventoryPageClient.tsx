'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';
import CompactInventoryCard from '@/components/inventory/CompactInventoryCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Layout } from '@/components/layout';
import { Vehicle } from '@/types';
import { ErrorBoundary } from '@/components/ui';
import { useRouter } from 'next/navigation';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';

function InventoryPageClientInner() {
  const router = useRouter();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const { 
    vehicles,
    filteredVehicles, 
    error, 
    isLoading, 
    filters,
    setFilters,
    refreshData,
    markAsSold,
    markAsPending,
    markAsAvailable
  } = useInventoryDirect();

  // Trigger image loading after inventory data is loaded
  useEffect(() => {
    if (!isLoading && filteredVehicles.length > 0) {
      // Delay image loading to prioritize inventory data display
      const timer = setTimeout(() => {
        setImagesLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filteredVehicles.length]);

  const handleEditVehicle = (vehicle: Vehicle) => {
    router.push(`/inventory/edit?id=${vehicle.unitId || vehicle.id}`);
  };

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleMarkAsSold = async (vehicle: Vehicle) => {
    try {
      await markAsSold(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
    }
  };

  const handleMarkAsPending = async (vehicle: Vehicle) => {
    try {
      await markAsPending(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as pending:', error);
    }
  };

  const handleMarkAsAvailable = async (vehicle: Vehicle) => {
    try {
      await markAsAvailable(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as available:', error);
    }
  };

  // Debug panel removed per request

  if (error) {
    return (
      <Layout>
        <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
          <AlertTitle>Error Loading Inventory</AlertTitle>
          {error}
          <Box sx={{ mt: 2 }}>
            <Button 
              onClick={() => refreshData()}
              variant="contained"
              color="inherit"
              size="small"
            >
              Try Again
            </Button>
          </Box>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
              Unit Inventory
            </Typography>
            <Typography variant="body1" color="text.primary">
              {isLoading ? 'Loading...' : `${filteredVehicles.length} vehicles`}
            </Typography>
          </Box>
          <Button 
            onClick={() => refreshData()}
            disabled={isLoading}
            variant="contained"
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>

        {/* Search Bar */}
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, p: 3, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
            {/* Search Input */}
            <TextField
              fullWidth
              label="Search Inventory"
              placeholder="Search by VIN, stock #, year, make, model, color, trim, price..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              variant="outlined"
              size="medium"
            />

            {/* Status Filter */}
            <TextField
              fullWidth
              select
              label="Status Filter"
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as 'all' | 'available' | 'pending' | 'sold' })}
              variant="outlined"
              size="medium"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
            </TextField>

            {/* Sort By */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                select
                label="Sort By"
                value={filters.sortBy}
                onChange={(e) => setFilters({ sortBy: e.target.value as 'year' | 'price' | 'make' | 'status' | 'dateAdded' })}
                variant="outlined"
                size="medium"
              >
                <MenuItem value="dateAdded">Date Added</MenuItem>
                <MenuItem value="year">Year</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="make">Make</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </TextField>
              <IconButton
                onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                sx={{ bgcolor: 'action.hover' }}
              >
                {filters.sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Active Filters Display */}
          {(filters.search || filters.status !== 'all') && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Active filters:
              </Typography>
              {filters.search && (
                <Chip
                  label={`Search: "${filters.search}"`}
                  onDelete={() => setFilters({ search: '' })}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {filters.status !== 'all' && (
                <Chip
                  label={`Status: ${filters.status}`}
                  onDelete={() => setFilters({ status: 'all' })}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              <Button
                onClick={() => setFilters({ search: '', status: 'all' })}
                size="small"
                variant="text"
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box>
          {isLoading ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2 
            }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2 
            }}>
              {filteredVehicles.map((vehicle) => (
                <CompactInventoryCard
                  key={vehicle.id}
                  item={vehicle}
                  onView={handleViewVehicle}
                  onEdit={() => handleEditVehicle(vehicle)}
                  onMarkAsPending={() => handleMarkAsPending(vehicle)}
                  onMarkAsAvailable={() => handleMarkAsAvailable(vehicle)}
                  onMarkAsSold={() => handleMarkAsSold(vehicle)}
                  enableImageLoading={imagesLoaded}
                />
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!isLoading && filteredVehicles.length === 0 && vehicles.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No vehicles match your search criteria.
              </Typography>
              <Button
                onClick={() => setFilters({ search: '', status: 'all' })}
                variant="contained"
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            </Box>
          )}

          {!isLoading && vehicles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No vehicles found
              </Typography>
              <Button 
                onClick={() => refreshData()}
                variant="contained"
                sx={{ mt: 2 }}
              >
                Refresh Inventory
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Vehicle details modal (reuses in-memory vehicle data; no extra API calls) */}
      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} isOpen={isModalOpen} onClose={closeModal} />
      )}

      {/* Debug panel removed */}
      </ErrorBoundary>
    </Layout>
  );
}

export default function InventoryPageClient() {
  // Hydration guard to avoid SSR vs CSR markup differences in SWA
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <InventoryPageClientInner />;
}

