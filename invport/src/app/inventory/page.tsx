'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import InventoryList from '@/components/inventory/InventoryList';
import { Vehicle } from '@/types';

export default function InventoryPage() {
  const router = useRouter();

  const handleAddVehicle = () => {
    router.push('/inventory/add');
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    console.log('View vehicle:', vehicle);
    // TODO: Open view vehicle modal or navigate to view page
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    console.log('Edit vehicle:', vehicle);
    // TODO: Open edit vehicle modal or navigate to edit page
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    console.log('Delete vehicle:', vehicle);
    // TODO: Show confirmation dialog and delete
  };

  return (
    <Layout>
      <div className="w-full">
        <InventoryList
          onAdd={handleAddVehicle}
          onView={handleViewVehicle}
          onEdit={handleEditVehicle}
          onDelete={handleDeleteVehicle}
        />
      </div>
    </Layout>
  );
}