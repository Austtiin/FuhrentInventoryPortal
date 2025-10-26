import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-700 mb-6">The page you’re looking for doesn’t exist or was moved.</p>
        <Link href="/inventory" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Go to Inventory</Link>
      </div>
    </Layout>
  );
}
