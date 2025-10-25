import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <Link href="/inventory" className="text-blue-600 hover:text-blue-700 text-sm">Back to Inventory</Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-800">
            This is a placeholder for the Settings page. You can add configuration controls here later.
          </p>
        </div>
      </div>
    </Layout>
  );
}
