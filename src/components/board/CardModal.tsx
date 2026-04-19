"use client";

import { useState } from "react";
import { PmAutocomplete } from "@/components/board/PmAutocomplete";
import type { PlannerCard } from "@/lib/types";

type Props = {
  card: PlannerCard;
  onClose: () => void;
};

export function CardModal({ card, onClose }: Props) {
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Card</h2>
          <button onClick={onClose} type="button" className="text-sm text-slate-300">
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Name</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </label>

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
