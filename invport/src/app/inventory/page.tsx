"use client";
import React, { Suspense } from 'react';
import InventoryPageClient from './InventoryPageClient';

// Client-rendered page wrapped in Suspense to satisfy useSearchParams requirements
export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageClient />
    </Suspense>
  );
}

