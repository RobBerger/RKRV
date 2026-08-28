'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Activity, ActivityType } from '@/types/database';
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '@/lib/constants';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ActivityTimeline({ parkId }: { parkId: string }) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<ActivityType>('call');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase
      .from('activity')
      .select('*')
      .eq('park_id', parkId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setError(error.message);
        } else {
          setActivity(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [parkId, refreshIndex]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from('activity').insert({
      park_id: parkId,
      date,
      type,
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNotes('');
    setDate(todayISO());
    setType('call');
    setRefreshIndex((i) => i + 1);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('activity').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setActivity((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Activity</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[auto_auto_1fr_auto] sm:items-end"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="input sm:w-auto"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="input sm:w-auto"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Notes
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened?"
            className="input"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="h-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading activity…</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-gray-500">No activity logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {activity.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">{formatDate(a.date)}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {ACTIVITY_TYPE_LABELS[a.type]}
                  </span>
                </div>
                {a.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{a.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="shrink-0 text-xs font-medium text-gray-400 hover:text-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
