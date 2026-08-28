'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Park, ParkStatus } from '@/types/database';
import { PARK_STATUSES, STATUS_LABELS, US_STATES } from '@/lib/constants';
import EditableField from '@/components/EditableField';
import StatusBadge from '@/components/StatusBadge';
import ActivityTimeline from '@/components/ActivityTimeline';

export default function ParkDetail({ parkId }: { parkId: string }) {
  const router = useRouter();
  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase
      .from('parks')
      .select('*')
      .eq('id', parkId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setPark(data);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [parkId]);

  async function updateField(fields: Partial<Park>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('parks')
      .update(fields)
      .eq('id', parkId)
      .select('*')
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }
    setPark(data);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${park?.name}"? This also deletes its activity history.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('parks').delete().eq('id', parkId);
    setDeleting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  if (error && !park) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!park) return <p className="text-sm text-gray-500">Park not found.</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to parks
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <EditableField
              label="Name"
              value={park.name}
              onSave={(value) => updateField({ name: value })}
            />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete park'}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </span>
            <div className="flex items-center gap-3">
              <select
                value={park.status}
                onChange={(e) => updateField({ status: e.target.value as ParkStatus })}
                className="input sm:w-auto"
              >
                {PARK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <StatusBadge status={park.status} />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Rating
            </span>
            <select
              value={park.rating ?? ''}
              onChange={(e) =>
                updateField({ rating: e.target.value ? Number(e.target.value) : null })
              }
              className="input sm:w-auto"
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-900">Location</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditableField
            label="Address"
            value={park.address ?? ''}
            onSave={(value) => updateField({ address: value || null })}
          />
          <EditableField
            label="City"
            value={park.city ?? ''}
            onSave={(value) => updateField({ city: value || null })}
          />
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              State
            </span>
            <select
              value={park.state ?? ''}
              onChange={(e) => updateField({ state: e.target.value || null })}
              className="input sm:w-auto"
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <EditableField
            label="Zip"
            value={park.zip ?? ''}
            onSave={(value) => updateField({ zip: value || null })}
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-900">Contact</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditableField
            label="Owner name"
            value={park.owner_name ?? ''}
            onSave={(value) => updateField({ owner_name: value || null })}
          />
          <EditableField
            label="Phone"
            value={park.phone ?? ''}
            type="tel"
            onSave={(value) => updateField({ phone: value || null })}
          />
          <EditableField
            label="Email"
            value={park.email ?? ''}
            type="email"
            onSave={(value) => updateField({ email: value || null })}
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-900">Financials</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EditableField
            label="Asking price"
            value={park.asking_price?.toString() ?? ''}
            type="number"
            onSave={(value) =>
              updateField({ asking_price: value ? Number(value) : null })
            }
          />
          <EditableField
            label="Number of sites"
            value={park.num_sites?.toString() ?? ''}
            type="number"
            onSave={(value) => updateField({ num_sites: value ? Number(value) : null })}
          />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-900">Notes</h2>
        <EditableField
          label="Notes"
          value={park.notes ?? ''}
          multiline
          onSave={(value) => updateField({ notes: value || null })}
        />

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      <ActivityTimeline parkId={parkId} />
    </div>
  );
}
