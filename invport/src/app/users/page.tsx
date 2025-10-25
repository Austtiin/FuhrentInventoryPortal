import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';

export default function UsersPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <Link href="/inventory" className="text-blue-600 hover:text-blue-700 text-sm">Back to Inventory</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-800">
            This is a placeholder for the Users page. You can add user management features here later.
          </p>
        </div>
      </div>
    </Layout>
  );
}
