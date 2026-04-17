"use client";

import { useState } from "react";
import type { EngineerSummary } from "@/lib/types";
import { FaPlus, FaUserCircle } from "react-icons/fa";

type Props = {
  engineers: EngineerSummary[];
  onAddEngineer: (email: string) => Promise<void>;
};

export function EngineerBar({ engineers, onAddEngineer }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEngineer() {
    setIsSaving(true);
    setError(null);
    try {
      await onAddEngineer(email.trim());
      setEmail("");
      setShowAddModal(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add engineer"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-900/95 p-3 backdrop-blur-sm">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
        Engineers
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-500 bg-slate-800 px-3 py-1 text-sm text-slate-100 hover:border-slate-300"
          aria-label="Add engineer by email"
        >
          <FaPlus className="h-3 w-3" />
          <span>Add engineer</span>
        </button>
        {engineers.map((engineer) => (
          <div
            key={engineer.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-gameplan-engineer", engineer.id);
            }}
            data-engineer-id={engineer.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm"
          >
            {engineer.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={engineer.avatar_url}
                alt={engineer.first_name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <FaUserCircle className="h-6 w-6 text-slate-300" />
            )}
            <span>{engineer.first_name}</span>
          </div>
        ))}
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold">Add Engineer</h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter a Webex user email address.
            </p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="engineer@company.com"
              className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
            {error ? (
              <p className="mt-2 text-xs text-red-300">{error}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowAddModal(false)}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || !email.trim()}
                onClick={() => void submitEngineer()}
                className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {isSaving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
