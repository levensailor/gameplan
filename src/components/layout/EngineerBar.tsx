"use client";

import { useState } from "react";
import type { EngineerSummary } from "@/lib/types";
import { FaPlus } from "react-icons/fa";
import { createFallbackAvatarDataUrl } from "@/lib/avatar";

type Props = {
  engineers: EngineerSummary[];
  onAddEngineer: (email: string) => Promise<void>;
  onUnassignEngineer: (cardId: string, engineerId: string) => Promise<void>;
  onUpdateEngineerProfile: (
    engineerId: string,
    payload: { title: string | null; skills: string | null }
  ) => Promise<void>;
};

export function EngineerBar({
  engineers,
  onAddEngineer,
  onUnassignEngineer,
  onUpdateEngineerProfile
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEngineer, setActiveEngineer] = useState<EngineerSummary | null>(null);
  const [profileTitle, setProfileTitle] = useState("");
  const [profileSkills, setProfileSkills] = useState("");

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

  function openEngineerProfile(engineer: EngineerSummary) {
    setActiveEngineer(engineer);
    setProfileTitle(engineer.title ?? "");
    setProfileSkills(engineer.skills ?? "");
  }

  async function saveEngineerProfile() {
    if (!activeEngineer) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onUpdateEngineerProfile(activeEngineer.id, {
        title: profileTitle.trim() || null,
        skills: profileSkills.trim() || null
      });
      setActiveEngineer(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save profile"
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
      <div
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const payload = event.dataTransfer.getData("application/x-gameplan-assignment");
          if (!payload) {
            return;
          }
          try {
            const parsed = JSON.parse(payload) as {
              engineerId?: string;
              sourceCardId?: string;
            };
            if (parsed.engineerId && parsed.sourceCardId) {
              void onUnassignEngineer(parsed.sourceCardId, parsed.engineerId);
            }
          } catch {
            // Ignore invalid drop payloads.
          }
        }}
        className="mb-2 rounded-md border border-dashed border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs text-rose-200"
      >
        Drop assigned engineer here to remove from card
      </div>
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
            onClick={() => openEngineerProfile(engineer)}
            data-engineer-id={engineer.id}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                engineer.avatar_url ??
                createFallbackAvatarDataUrl(
                  engineer.first_name,
                  engineer.last_name,
                  engineer.email
                )
              }
              alt={engineer.first_name || "Engineer"}
              className="h-6 w-6 rounded-full"
            />
            <span>{engineer.first_name}</span>
          </div>
        ))}
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm -translate-y-12 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:-translate-y-16">
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

      {activeEngineer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md -translate-y-14 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:-translate-y-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Engineer Profile</h3>
              <button
                type="button"
                onClick={() => setActiveEngineer(null)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <p>
                <span className="text-slate-400">First:</span>{" "}
                {activeEngineer.first_name || "-"}
              </p>
              <p>
                <span className="text-slate-400">Last:</span>{" "}
                {activeEngineer.last_name || "-"}
              </p>
              <p>
                <span className="text-slate-400">Email:</span>{" "}
                {activeEngineer.email}
              </p>
              <label className="grid gap-1">
                <span className="text-slate-300">Title</span>
                <input
                  value={profileTitle}
                  onChange={(event) => setProfileTitle(event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-slate-300">Skills</span>
                <textarea
                  value={profileSkills}
                  onChange={(event) => setProfileSkills(event.target.value)}
                  rows={5}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
                />
              </label>
            </div>
            {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setActiveEngineer(null)}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void saveEngineerProfile()}
                className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
