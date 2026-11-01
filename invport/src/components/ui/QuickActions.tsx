import Link from 'next/link';
import {
  CubeIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';

const quickActions = [
  { label: 'Add New Vehicle', icon: PlusIcon, route: '/inventory/add' },
  { label: 'Search Inventory', icon: MagnifyingGlassIcon, route: '/inventory' },
  { label: 'View All Inventory', icon: CubeIcon, route: '/inventory' },
  { label: 'Export Data', icon: DocumentArrowDownIcon, route: '/reports' },
  { label: 'Generate Report', icon: ArrowTrendingUpIcon, route: '/reports' },
];

export const QuickActions = () => (
  <section className="rounded border border-gray-200 bg-white p-4 sm:p-6" aria-labelledby="quick-actions-heading">
    <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
    <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {quickActions.map(action => (
        <li key={action.label}>
          <Link href={action.route} className="group flex items-center gap-3 border-t border-gray-100 py-4 text-sm text-slate-700 hover:text-slate-950">
            <action.icon className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="flex-1 font-medium group-hover:underline">{action.label}</span>
            <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-slate-500" />
          </Link>
        </li>
      ))}
    </ul>
  </section>
);
