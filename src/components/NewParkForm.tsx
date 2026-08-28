'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PARK_STATUSES, STATUS_LABELS, US_STATES } from '@/lib/constants';
import type { ParkStatus } from '@/types/database';

export default function NewParkForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [numSites, setNumSites] = useState('');
  const [status, setStatus] = useState<ParkStatus>('lead');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('parks')
      .insert({
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        owner_name: ownerName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        asking_price: askingPrice ? Number(askingPrice) : null,
        num_sites: numSites ? Number(numSites) : null,
        status,
        notes: notes.trim() || null,
      })
      .select('id')
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/parks/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <Field label="Name" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Address">
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
        </Field>
        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} className="input" />
        </Field>
        <Field label="State">
          <select value={state} onChange={(e) => setState(e.target.value)} className="input">
            <option value="">—</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Zip">
          <input value={zip} onChange={(e) => setZip(e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Owner name">
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="input" />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ParkStatus)}
            className="input"
          >
            {PARK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Asking price">
          <input
            type="number"
            step="1"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Number of sites">
          <input
            type="number"
            step="1"
            value={numSites}
            onChange={(e) => setNumSites(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="input"
        />
      </Field>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save park'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
