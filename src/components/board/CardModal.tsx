"use client";

import { useEffect, useState } from "react";
import { FaPaperclip } from "react-icons/fa";
import { PmAutocomplete } from "@/components/board/PmAutocomplete";
import type { CardLabel, PlannerCard } from "@/lib/types";

type CardFileAttachment = {
  id: string;
  card_id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
  url: string;
};

type CardLinkAttachment = {
  id: string;
  card_id: string;
  title: string;
  url: string;
  created_at: string;
};

type Props = {
  card: PlannerCard;
  labels: CardLabel[];
  activeLabelIds: string[];
  onAddLabel: (labelId: string) => Promise<void>;
  onRemoveLabel: (labelId: string) => Promise<void>;
  onCreateLabel: (name: string) => Promise<void>;
  onAttachmentChanged: () => Promise<void>;
  onClose: () => void;
};

export function CardModal({
  card,
  labels,
  activeLabelIds,
  onAddLabel,
  onRemoveLabel,
  onCreateLabel,
  onAttachmentChanged,
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
  const [attachments, setAttachments] = useState<{
    files: CardFileAttachment[];
    links: CardLinkAttachment[];
  }>({ files: [], links: [] });
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const activeLabels = labels.filter((label) => activeLabelIds.includes(label.id));
  const availableLabels = labels.filter(
    (label) => !activeLabelIds.includes(label.id)
  );
  const attachmentPills = [
    ...attachments.files.map((file) => ({
      id: `file:${file.id}`,
      name: file.file_name,
      href: file.url
    })),
    ...attachments.links.map((link) => ({
      id: `link:${link.id}`,
      name: link.title,
      href: link.url
    }))
  ];

  useEffect(() => {
    async function loadAttachments() {
      setAttachmentError(null);
      const response = await fetch(`/api/cards/${card.id}/attachments`);
      const payload = (await response.json()) as {
        files?: CardFileAttachment[];
        links?: CardLinkAttachment[];
        error?: string;
      };
      if (!response.ok) {
        setAttachmentError(payload.error ?? "Failed to load attachments");
        return;
      }
      setAttachments({
        files: payload.files ?? [],
        links: payload.links ?? []
      });
    }

    void loadAttachments();
  }, [card.id]);

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

  async function uploadAttachment(file: File) {
    setAttachmentError(null);
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/cards/${card.id}/attachments`, {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as {
        files?: CardFileAttachment[];
        links?: CardLinkAttachment[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to upload file");
      }
      setAttachments({
        files: payload.files ?? [],
        links: payload.links ?? []
      });
      await onAttachmentChanged();
    } catch (error) {
      setAttachmentError(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploadingFile(false);
    }
  }

  async function addLinkAttachment() {
    if (!linkUrl.trim()) {
      return;
    }
    setAttachmentError(null);
    setIsAddingLink(true);
    try {
      const response = await fetch(`/api/cards/${card.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: linkTitle.trim() || undefined,
          url: linkUrl.trim()
        })
      });
      const payload = (await response.json()) as {
        files?: CardFileAttachment[];
        links?: CardLinkAttachment[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add link");
      }
      setAttachments({
        files: payload.files ?? [],
        links: payload.links ?? []
      });
      setLinkTitle("");
      setLinkUrl("");
      await onAttachmentChanged();
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "Failed to add link");
    } finally {
      setIsAddingLink(false);
    }
  }

  async function removeAttachment(type: "file" | "link", id: string) {
    setAttachmentError(null);
    try {
      const response = await fetch(`/api/cards/${card.id}/attachments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id })
      });
      const payload = (await response.json()) as {
        files?: CardFileAttachment[];
        links?: CardLinkAttachment[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to remove attachment");
      }
      setAttachments({
        files: payload.files ?? [],
        links: payload.links ?? []
      });
      await onAttachmentChanged();
    } catch (error) {
      setAttachmentError(
        error instanceof Error ? error.message : "Failed to remove attachment"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-3">
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

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Attachments</span>
              <button
                type="button"
                onClick={() => setShowAttachmentModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:border-slate-400"
              >
                <FaPaperclip className="h-3 w-3" />
                Add attachments
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachmentPills.length > 0 ? (
                attachmentPills.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-xs text-slate-100 hover:border-slate-400"
                  >
                    <FaPaperclip className="h-2.5 w-2.5" />
                    {item.name}
                  </a>
                ))
              ) : (
                <span className="text-xs text-slate-500">No attachments added</span>
              )}
            </div>
            {attachmentError ? (
              <p className="text-xs text-red-300">{attachmentError}</p>
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
      {showAttachmentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add attachments</h3>
              <button
                type="button"
                onClick={() => setShowAttachmentModal(false)}
                className="text-sm text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="mt-3 rounded-md border border-slate-700 bg-slate-900/80 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-600 px-3 py-2 text-xs text-slate-200 hover:border-slate-400">
                  {isUploadingFile ? "Uploading..." : "Upload file"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploadingFile}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadAttachment(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <span className="text-xs text-slate-500">or add a file URL</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.target.value)}
                  placeholder="Link title (optional)"
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                />
                <input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void addLinkAttachment()}
                disabled={isAddingLink}
                className="mt-2 rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
              >
                {isAddingLink ? "Adding..." : "Add URL"}
              </button>
              {attachments.files.length > 0 || attachments.links.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {attachments.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-xs"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sky-300 hover:text-sky-200"
                      >
                        {file.file_name}
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeAttachment("file", file.id)}
                        className="text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {attachments.links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-xs"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sky-300 hover:text-sky-200"
                      >
                        {link.title}
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeAttachment("link", link.id)}
                        className="text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">No attachments yet.</p>
              )}
            </div>
            {attachmentError ? (
              <p className="mt-2 text-xs text-red-300">{attachmentError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
