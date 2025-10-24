import React, { Suspense } from 'react';
import InventoryPageClient from './InventoryPageClient';

// Static export - all data fetching happens client-side via Azure Functions
export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-600">Loading inventory…</div>}>
      <InventoryPageClient />
    </Suspense>
  );
}

