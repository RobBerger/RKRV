'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Park, ParkStatus } from '@/types/database';
import { PARK_STATUSES, STATUS_LABELS } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';

type SortColumn = 'name' | 'city' | 'state' | 'owner_name' | 'asking_price' | 'num_sites' | 'rating' | 'status';
type SortDirection = 'asc' | 'desc';

const COLUMNS: { key: SortColumn; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'asking_price', label: 'Asking Price', align: 'right' },
  { key: 'num_sites', label: 'Sites', align: 'right' },
  { key: 'rating', label: 'Rating', align: 'right' },
  { key: 'status', label: 'Status' },
];

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ParksTable() {
  const router = useRouter();
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParkStatus | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<string | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase
      .from('parks')
      .select('*')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setParks(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const availableStates = useMemo(() => {
    const states = new Set<string>();
    parks.forEach((p) => {
      if (p.state) states.add(p.state);
    });
    return Array.from(states).sort();
  }, [parks]);

  const filteredAndSorted = useMemo(() => {
    const term = search.trim().toLowerCase();

    let result = parks.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (stateFilter !== 'all' && p.state !== stateFilter) return false;
      if (term) {
        const haystack = `${p.name} ${p.city ?? ''} ${p.owner_name ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    result = result.slice().sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [parks, search, statusFilter, stateFilter, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Parks</h1>
        <Link
          href="/parks/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          + Add park
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search name, city, owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ParkStatus | 'all')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
        >
          <option value="all">All statuses</option>
          {PARK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
        >
          <option value="all">All states</option>
          {availableStates.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading parks…</p>
      ) : filteredAndSorted.length === 0 ? (
        <p className="text-sm text-gray-500">No parks match your filters.</p>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`cursor-pointer select-none px-4 py-2.5 font-medium text-gray-500 hover:text-gray-900 ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.label}
                      {sortColumn === col.key && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSorted.map((park) => (
                  <tr
                    key={park.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/parks/${park.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {park.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{park.city || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{park.state || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{park.owner_name || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {formatCurrency(park.asking_price)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {park.num_sites ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {park.rating ? '★'.repeat(park.rating) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={park.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 sm:hidden">
            {filteredAndSorted.map((park) => (
              <li key={park.id}>
                <Link
                  href={`/parks/${park.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{park.name}</p>
                      <p className="text-sm text-gray-500">
                        {[park.city, park.state].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    <StatusBadge status={park.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span>{park.owner_name || '—'}</span>
                    <span>{formatCurrency(park.asking_price)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
