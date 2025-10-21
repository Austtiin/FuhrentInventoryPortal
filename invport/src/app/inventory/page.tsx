import React from 'react';
import InventoryPageClient from './InventoryPageClient';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function InventoryPage() {
  return <InventoryPageClient />;
  
}

