'use client';

import { useState, type KeyboardEvent } from 'react';

interface EditableFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  type?: 'text' | 'number' | 'email' | 'tel';
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
}

export default function EditableField({
  label,
  value,
  multiline,
  type = 'text',
  placeholder = '—',
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function commit() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      cancel();
    }
  }

  if (editing) {
    return (
      <div>
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            rows={4}
            disabled={saving}
            className="input"
          />
        ) : (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="input"
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="block w-full rounded-md px-0 py-1 text-left text-sm text-gray-900 hover:bg-gray-50 hover:px-2"
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </button>
    </div>
  );
}
