'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';
import CompactInventoryCard from '@/components/inventory/CompactInventoryCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { Vehicle, InventoryFilters } from '@/types';
import { ErrorBoundary } from '@/components/ui';
import { useRouter } from 'next/navigation';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import EmptyState from '@/components/ui/EmptyState';
import UnitViewStatsBar from '@/components/inventory/UnitViewStatsBar';
import { useUnitViewSummary } from '@/hooks/useUnitViewStats';
import { pickViewLeaders } from '@/lib/unitViewStats';

const vehicleUnitId = (vehicle: Vehicle): number | null => {
  const id = vehicle.unitId ?? Number(vehicle.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

function InventoryPageClientInner() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const viewSummary = useUnitViewSummary();
  
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
  } = useInventoryDirect(viewSummary.byUnitId);

  const changeFilters = (next: Partial<InventoryFilters>) => {
    setCurrentPage(1);
    setFilters(next);
  };
  const sortingByViews = filters.sortBy === 'monthViews' || filters.sortBy === 'lifetimeViews';
  const waitingForViews = sortingByViews && !viewSummary.data && viewSummary.isLoading;
  const vehiclesByUnitId = useMemo(() => {
    const map = new Map<number, Vehicle>();
    for (const v of vehicles) {
      const id = vehicleUnitId(v);
      if (id !== null) map.set(id, v);
    }
    return map;
  }, [vehicles]);
  const viewLeaders = useMemo(
    () => pickViewLeaders(viewSummary.data?.units ?? [], new Set(vehiclesByUnitId.keys())),
    [viewSummary.data, vehiclesByUnitId],
  );

  const handleRefreshAll = () => {
    void refreshData();
    void viewSummary.refresh();
  };

  const handleEditVehicle = useCallback((vehicle: Vehicle) => {
    router.push(`/inventory/edit?id=${vehicle.unitId || vehicle.id}`);
  }, [router]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleMarkAsSold = useCallback(async (vehicle: Vehicle) => {
    try {
      await markAsSold(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
    }
  }, [markAsSold]);

  const handleMarkAsPending = useCallback(async (vehicle: Vehicle) => {
    try {
      await markAsPending(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as pending:', error);
    }
  }, [markAsPending]);

  const handleMarkAsAvailable = useCallback(async (vehicle: Vehicle) => {
    try {
      await markAsAvailable(vehicle.id);
    } catch (error) {
      console.error('Error marking vehicle as available:', error);
    }
  }, [markAsAvailable]);

  // Debug panel removed per request

  if (error && vehicles.length === 0) {
    return (
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
    );
  }

  return (
      <ErrorBoundary>
        <Box>
        {error && vehicles.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Could not refresh inventory. Showing previously loaded items. {error}
          </Alert>
        )}
        {/* Actions and Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="body2" color="text.secondary" role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading && <CircularProgress size={16} aria-label="Loading inventory" />}
            {isLoading && vehicles.length === 0
              ? 'Loading inventory...'
              : `Showing ${Math.min(currentPage * itemsPerPage, filteredVehicles.length)} of ${filteredVehicles.length} vehicles`}
            {isLoading && vehicles.length > 0 && ' - refreshing in background'}
          </Typography>
          <Button 
            onClick={handleRefreshAll}
            disabled={isLoading}
            variant="contained"
            startIcon={<RefreshIcon />}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <UnitViewStatsBar
          summary={viewSummary.data}
          leaders={viewLeaders}
          vehiclesByUnitId={vehiclesByUnitId}
          isLoading={viewSummary.isLoading || isLoading}
          isRefreshing={viewSummary.isRefreshing}
          error={viewSummary.error}
          lastUpdated={viewSummary.lastUpdated}
          onRefresh={() => void viewSummary.refresh()}
          onSelectVehicle={handleViewVehicle}
        />

        {/* Search Bar */}
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
            {/* Search Input */}
            <TextField
              fullWidth
              label="Search Inventory"
              placeholder="Search by VIN, stock #, year, make, model, color, trim, price..."
              value={filters.search}
              onChange={(e) => changeFilters({ search: e.target.value })}
              variant="outlined"
              size="medium"
            />

            {/* Status Filter */}
            <TextField
              fullWidth
              select
              label="Status Filter"
              value={filters.status}
              onChange={(e) => changeFilters({ status: e.target.value as InventoryFilters['status'] })}
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
                onChange={(e) => changeFilters({
                  sortBy: e.target.value as InventoryFilters['sortBy'],
                  ...(['monthViews', 'lifetimeViews'].includes(e.target.value) ? { sortOrder: 'desc' as const } : {}),
                })}
                variant="outlined"
                size="medium"
              >
                <MenuItem value="dateAdded">Date Added</MenuItem>
                <MenuItem value="year">Year</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="make">Make</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="monthViews" disabled={!viewSummary.data}>Views this month</MenuItem>
                <MenuItem value="lifetimeViews" disabled={!viewSummary.data}>Lifetime views</MenuItem>
              </TextField>
              <IconButton
                onClick={() => changeFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                aria-label={filters.sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                title={sortingByViews ? (filters.sortOrder === 'asc' ? 'Lowest views first' : 'Highest views first') : (filters.sortOrder === 'asc' ? 'Ascending' : 'Descending')}
                sx={{ bgcolor: 'action.hover' }}
              >
                {filters.sortOrder === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              </IconButton>
            </Box>
            {sortingByViews && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filters.sortOrder === 'desc' ? 'Highest views first' : 'Lowest views first'}.
                {' '}Website detail-page views, not unique visitors.
              </Typography>
            )}
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
          {(isLoading && vehicles.length === 0) || waitingForViews ? (
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
              {filteredVehicles.slice(0, currentPage * itemsPerPage).map((vehicle) => {
                const unitId = vehicleUnitId(vehicle);
                return (
                <CompactInventoryCard
                  key={vehicle.id}
                  item={vehicle}
                  onView={handleViewVehicle}
                  onEdit={handleEditVehicle}
                  onMarkAsPending={handleMarkAsPending}
                  onMarkAsAvailable={handleMarkAsAvailable}
                  onMarkAsSold={handleMarkAsSold}
                  viewStats={viewSummary.data && unitId !== null ? (viewSummary.byUnitId.get(unitId) ?? null) : undefined}
                  viewStatsLoading={viewSummary.isLoading}
                  hottest={unitId !== null && viewLeaders.hottest?.unitId === unitId}
                  mostPopular={unitId !== null && viewLeaders.mostPopular?.unitId === unitId}
                />
                );
              })}
            </Box>
          )}

          {/* Empty state */}
          {!isLoading && filteredVehicles.length === 0 && vehicles.length > 0 && (
            <EmptyState
              title="No vehicles match your search criteria."
              actionLabel="Clear Filters"
              onAction={() => setFilters({ search: '', status: 'all' })}
            />
          )}

          {!isLoading && vehicles.length === 0 && (
            <EmptyState
              title="No vehicles found"
              actionLabel="Refresh Inventory"
              onAction={() => refreshData()}
            />
          )}
          {/* Load More */}
          {!isLoading && filteredVehicles.length > currentPage * itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Show {Math.min(itemsPerPage, filteredVehicles.length - currentPage * itemsPerPage)} more
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
  );
}

export default function InventoryPageClient() {
  // Hydration guard to avoid SSR vs CSR markup differences in SWA
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Box role="status" sx={{ p: 3 }}><CircularProgress size={20} /> Loading inventory...</Box>;
  return <InventoryPageClientInner />;
}
