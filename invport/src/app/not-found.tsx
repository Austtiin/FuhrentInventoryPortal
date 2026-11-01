import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-700 mb-6">The page you requested does not exist or was moved.</p>
        <Link href="/inventory" className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-800">Go to Inventory</Link>
      </div>
  );
}
