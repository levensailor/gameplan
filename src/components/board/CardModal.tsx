"use client";

import { useState } from "react";
import { PmAutocomplete } from "@/components/board/PmAutocomplete";
import type { CardLabel, PlannerCard } from "@/lib/types";

type Props = {
  card: PlannerCard;
  labels: CardLabel[];
  activeLabelIds: string[];
  onAddLabel: (labelId: string) => Promise<void>;
  onRemoveLabel: (labelId: string) => Promise<void>;
  onCreateLabel: (name: string) => Promise<void>;
  onClose: () => void;
};

export function CardModal({
  card,
  labels,
  activeLabelIds,
  onAddLabel,
  onRemoveLabel,
  onCreateLabel,
  onClose
}: Props) {
  const [form, setForm] = useState({
    name: card.name,
    description: card.description ?? "",
    customerName: card.customer_name ?? "",
    projectManagerName: card.project_manager_name ?? "",
    projectManagerEmail: card.project_manager_email ?? "",
    projectCode: card.project_code ?? "",
    engineeringHours: card.engineering_hours?.toString() ?? "",
    notes: card.notes ?? "",
    dueDate: card.due_date?.slice(0, 10) ?? ""
  });
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);

  const activeLabels = labels.filter((label) => activeLabelIds.includes(label.id));
  const availableLabels = labels.filter(
    (label) => !activeLabelIds.includes(label.id)
  );

  async function save() {
    await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        customerName: form.customerName || null,
        projectManagerName: form.projectManagerName || null,
        projectManagerEmail: form.projectManagerEmail || null,
        projectCode: form.projectCode || null,
        engineeringHours: form.engineeringHours
          ? Number(form.engineeringHours)
          : null,
        notes: form.notes || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      })
    });
    onClose();
  }

  async function removeCard() {
    const shouldDelete = window.confirm("Delete this card?");
    if (!shouldDelete) {
      return;
    }
    await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    onClose();
  }

  async function addExistingLabel(labelId: string) {
    setLabelError(null);
    try {
      await onAddLabel(labelId);
    } catch (error) {
      setLabelError(error instanceof Error ? error.message : "Failed to add label");
    }
  }

  async function removeExistingLabel(labelId: string) {
    setLabelError(null);
    try {
      await onRemoveLabel(labelId);
    } catch (error) {
      setLabelError(
        error instanceof Error ? error.message : "Failed to remove label"
      );
    }
  }

  async function createNewLabel() {
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      return;
    }
    setLabelError(null);
    try {
      await onCreateLabel(trimmed);
      setNewLabelName("");
      setShowAddLabel(false);
    } catch (error) {
      setLabelError(
        error instanceof Error ? error.message : "Failed to create label"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="w-full bg-transparent pr-3 text-lg font-semibold text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="Untitled card"
          />
          <button onClick={onClose} type="button" className="text-sm text-slate-300">
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Labels</span>
              <button
                type="button"
                onClick={() => setShowAddLabel((prev) => !prev)}
                className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:border-slate-400"
              >
                Add label
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeLabels.length > 0 ? (
                activeLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => void removeExistingLabel(label.id)}
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-100"
                    style={{ backgroundColor: `${label.color_hex}33` }}
                    title="Click to remove"
                  >
                    {label.name} x
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-500">No labels selected</span>
              )}
            </div>
            {showAddLabel ? (
              <div className="rounded-md border border-slate-700 bg-slate-900/80 p-3">
                <div className="flex flex-wrap gap-2">
                  {availableLabels.length > 0 ? (
                    availableLabels.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => void addExistingLabel(label.id)}
                        className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:border-slate-400"
                      >
                        {label.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      All existing labels are already on this card.
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={newLabelName}
                    onChange={(event) => setNewLabelName(event.target.value)}
                    placeholder="Create new label"
                    className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void createNewLabel()}
                    className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : null}
            {labelError ? (
              <p className="text-xs text-red-300">{labelError}</p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Project Code</span>
              <input
                value={form.projectCode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, projectCode: event.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Engineering Hours</span>
              <input
                value={form.engineeringHours}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    engineeringHours: event.target.value
                  }))
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Project Manager</span>
              <PmAutocomplete
                value={form.projectManagerName}
                onSelect={(name, email) =>
                  setForm((prev) => ({
                    ...prev,
                    projectManagerName: name,
                    projectManagerEmail: email
                  }))
                }
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">PM Email</span>
              <input
                value={form.projectManagerEmail}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    projectManagerEmail: event.target.value
                  }))
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Customer Name</span>
              <input
                value={form.customerName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerName: event.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">Due Date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={3}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={removeCard}
            className="rounded-md border border-red-500/30 px-4 py-2 text-sm text-red-300"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
