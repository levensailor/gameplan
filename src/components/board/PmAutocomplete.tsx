"use client";

import { useEffect, useState } from "react";

type DirectoryPerson = {
  person_id: string;
  display_name: string;
  email: string | null;
};

type Props = {
  value: string;
  onSelect: (name: string, email: string) => void;
};

export function PmAutocomplete({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<DirectoryPerson[]>([]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(
        `/api/webex/directory?search=${encodeURIComponent(query)}`
      );
      if (!response.ok || cancelled) {
        return;
      }
      const payload = (await response.json()) as { items: DirectoryPerson[] };
      if (!cancelled) {
        setOptions(payload.items ?? []);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="grid gap-1">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
        placeholder="Search project manager"
      />
      {options.length > 0 ? (
        <div className="max-h-36 overflow-auto rounded-md border border-slate-700 bg-slate-900">
          {options.map((option) => (
            <button
              key={option.person_id}
              type="button"
              className="block w-full border-b border-slate-800 px-3 py-2 text-left text-xs hover:bg-slate-800"
              onClick={() =>
                onSelect(option.display_name, option.email ?? "")
              }
            >
              <span className="block">{option.display_name}</span>
              {option.email ? (
                <span className="text-slate-400">{option.email}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
