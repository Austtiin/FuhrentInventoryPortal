import React, { Suspense } from 'react';
import InventoryPageClient from './InventoryPageClient';

// Static export - all data fetching happens client-side via Azure Functions
export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageClient />
    </Suspense>
  );
}

