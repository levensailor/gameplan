"use client";

import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { CardItem } from "@/components/board/CardItem";
import { CardModal } from "@/components/board/CardModal";
import { EngineerBar } from "@/components/layout/EngineerBar";
import { createFallbackAvatarDataUrl } from "@/lib/avatar";
import type {
  BoardSnapshot,
  CardLabel,
  PlannerCard
} from "@/lib/types";

type Props = {
  initialData: BoardSnapshot;
};

export function Board({ initialData }: Props) {
  const [cards, setCards] = useState(initialData.cards);
  const [engineers, setEngineers] = useState(initialData.engineers);
  const [labels, setLabels] = useState(initialData.labels);
  const [assignments, setAssignments] = useState(initialData.assignments);
  const [cardLabels, setCardLabels] = useState(initialData.cardLabels);
  const [cardFiles, setCardFiles] = useState(initialData.cardFiles);
  const [cardLinks, setCardLinks] = useState(initialData.cardLinks);
  const [activeCard, setActiveCard] = useState<PlannerCard | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedAssignment, setDraggedAssignment] = useState<{
    engineerId: string;
    sourceCardId: string;
  } | null>(null);
  const [dropFeedback, setDropFeedback] = useState<string | null>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [addCardColumnId, setAddCardColumnId] = useState<string | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [addCardError, setAddCardError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/webex/directory?sync=1");
  }, []);

  useEffect(() => {
    if (!draggedAssignment) {
      return;
    }

    function isDropOnCard(target: EventTarget | null): boolean {
      return (
        target instanceof Element &&
        target.closest('[data-card-drop-zone="true"]') !== null
      );
    }

    function handleWindowDragOver(event: DragEvent) {
      event.preventDefault();
    }

    function handleWindowDrop(event: DragEvent) {
      event.preventDefault();
      const payload =
        event.dataTransfer?.getData("application/x-gameplan-assignment") ?? "";
      setDraggedAssignment(null);

      if (!payload || isDropOnCard(event.target)) {
        return;
      }

      try {
        const parsed = JSON.parse(payload) as {
          engineerId?: string;
          sourceCardId?: string;
        };
        if (parsed.engineerId && parsed.sourceCardId) {
          void unassignEngineer(parsed.sourceCardId, parsed.engineerId);
          setDropFeedback("Engineer removed from card");
        }
      } catch {
        // Ignore invalid assignment payloads.
      }
    }

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);
    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, [draggedAssignment]);

  useEffect(() => {
    if (!dropFeedback) {
      return;
    }
    const timer = window.setTimeout(() => setDropFeedback(null), 1800);
    return () => window.clearTimeout(timer);
  }, [dropFeedback]);

  const engineersByCard = useMemo(() => {
    const map = new Map<
      string,
      { engineerId: string; avatarUrl: string; label: string }[]
    >();
    for (const assignment of assignments) {
      const engineer = engineers.find(
        (item) => item.id === assignment.engineer_id
      );
      if (!engineer) {
        continue;
      }
      const existing = map.get(assignment.card_id) ?? [];
      existing.push({
        engineerId: engineer.id,
        avatarUrl:
          engineer.avatar_url ??
          createFallbackAvatarDataUrl(
            engineer.first_name,
            engineer.last_name,
            engineer.email
          ),
        label: `${engineer.first_name} ${engineer.last_name}`.trim()
      });
      map.set(assignment.card_id, existing);
    }
    return map;
  }, [assignments, engineers]);

  const labelsByCard = useMemo(() => {
    const labelsById = new Map(labels.map((label) => [label.id, label]));
    const map = new Map<string, CardLabel[]>();
    for (const item of cardLabels) {
      const label = labelsById.get(item.label_id);
      if (!label) {
        continue;
      }
      const existing = map.get(item.card_id) ?? [];
      existing.push(label);
      map.set(item.card_id, existing);
    }
    return map;
  }, [cardLabels, labels]);

  const hasAttachmentsByCard = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const file of cardFiles) {
      map.set(file.card_id, true);
    }
    for (const link of cardLinks) {
      map.set(link.card_id, true);
    }
    return map;
  }, [cardFiles, cardLinks]);

  async function addCard(columnId: string, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, name: trimmedName })
    });
    if (!response.ok) {
      throw new Error("Failed to create card");
    }
    const payload = (await response.json()) as { card: PlannerCard };
    setCards((prev) => [...prev, payload.card]);
  }

  function openAddCardModal(columnId: string) {
    setAddCardColumnId(columnId);
    setNewCardName("");
    setAddCardError(null);
    setIsAddCardModalOpen(true);
  }

  function closeAddCardModal() {
    setIsAddCardModalOpen(false);
    setAddCardColumnId(null);
    setNewCardName("");
    setAddCardError(null);
  }

  async function submitAddCard() {
    if (!addCardColumnId) {
      return;
    }

    const trimmed = newCardName.trim();
    if (!trimmed) {
      setAddCardError("Card name is required.");
      return;
    }

    setIsCreatingCard(true);
    setAddCardError(null);
    try {
      await addCard(addCardColumnId, trimmed);
      closeAddCardModal();
    } catch {
      setAddCardError("Failed to create card. Please try again.");
    } finally {
      setIsCreatingCard(false);
    }
  }

  async function deleteCard(cardId: string) {
    const shouldDelete = window.confirm("Delete this card?");
    if (!shouldDelete) {
      return;
    }
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    setCardFiles((prev) => prev.filter((item) => item.card_id !== cardId));
    setCardLinks((prev) => prev.filter((item) => item.card_id !== cardId));
  }

  async function moveCardToColumn(columnId: string) {
    if (!draggedCardId) {
      return;
    }
    const columnCards = cards.filter((item) => item.column_id === columnId);
    const nextPosition =
      Math.max(0, ...columnCards.map((item) => item.position)) + 10;
    await fetch(`/api/cards/${draggedCardId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, position: nextPosition })
    });
    setCards((prev) =>
      prev.map((item) =>
        item.id === draggedCardId
          ? { ...item, column_id: columnId, position: nextPosition }
          : item
      )
    );
    setDraggedCardId(null);
  }

  async function assignEngineer(cardId: string, engineerId: string) {
    await fetch(`/api/cards/${cardId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerId, action: "assign" })
    });
    setAssignments((prev) => [
      ...prev.filter(
        (item) => !(item.card_id === cardId && item.engineer_id === engineerId)
      ),
      { card_id: cardId, engineer_id: engineerId }
    ]);
  }

  async function unassignEngineer(cardId: string, engineerId: string) {
    await fetch(`/api/cards/${cardId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engineerId, action: "remove" })
    });
    setAssignments((prev) =>
      prev.filter(
        (item) => !(item.card_id === cardId && item.engineer_id === engineerId)
      )
    );
  }

  async function handleEngineerDropOnCard(
    targetCardId: string,
    engineerId: string,
    sourceCardId?: string
  ) {
    if (sourceCardId && sourceCardId !== targetCardId) {
      await unassignEngineer(sourceCardId, engineerId);
    }
    await assignEngineer(targetCardId, engineerId);
  }

  async function addEngineerByEmail(email: string) {
    const response = await fetch("/api/engineers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const payload = (await response.json()) as {
      engineer?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        avatar_url: string | null;
        title: string | null;
        skills: string | null;
      };
      error?: string;
    };

    if (!response.ok || !payload.engineer) {
      throw new Error(payload.error ?? "Failed to add engineer");
    }

    setEngineers((prev) => {
      const filtered = prev.filter((item) => item.id !== payload.engineer?.id);
      return [...filtered, payload.engineer as (typeof prev)[number]].sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      );
    });
  }

  async function updateEngineerProfile(
    engineerId: string,
    payload: { title: string | null; skills: string | null }
  ) {
    const response = await fetch(`/api/engineers/${engineerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as {
      engineer?: (typeof engineers)[number];
      error?: string;
    };
    if (!response.ok || !data.engineer) {
      throw new Error(data.error ?? "Failed to update engineer");
    }
    setEngineers((prev) =>
      prev.map((engineer) =>
        engineer.id === data.engineer?.id ? data.engineer : engineer
      )
    );
  }

  async function addLabelToCard(cardId: string, labelId: string) {
    const response = await fetch(`/api/cards/${cardId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId, action: "add" })
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Failed to add label");
    }
    setCardLabels((prev) => {
      const exists = prev.some(
        (item) => item.card_id === cardId && item.label_id === labelId
      );
      if (exists) {
        return prev;
      }
      return [...prev, { card_id: cardId, label_id: labelId }];
    });
  }

  async function removeLabelFromCard(cardId: string, labelId: string) {
    const response = await fetch(`/api/cards/${cardId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId, action: "remove" })
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Failed to remove label");
    }
    setCardLabels((prev) =>
      prev.filter(
        (item) => !(item.card_id === cardId && item.label_id === labelId)
      )
    );
  }

  async function createLabel(name: string): Promise<CardLabel> {
    const response = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const payload = (await response.json()) as {
      label?: CardLabel;
      error?: string;
    };
    if (!response.ok || !payload.label) {
      throw new Error(payload.error ?? "Failed to create label");
    }
    setLabels((prev) => {
      const filtered = prev.filter((item) => item.id !== payload.label?.id);
      return [...filtered, payload.label as CardLabel].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    return payload.label;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-24">
        {initialData.columns.map((column) => {
          const columnCards = cards.filter((card) => card.column_id === column.id);

          return (
            <div
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                void moveCardToColumn(column.id);
              }}
              className="min-h-[640px] w-[320px] min-w-[320px] rounded-lg border border-slate-800 bg-slate-900/70 p-3"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                {column.name}
              </h3>
              <div className="mt-3 space-y-2">
                {columnCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    labels={labelsByCard.get(card.id) ?? []}
                    assignedEngineers={engineersByCard.get(card.id) ?? []}
                    hasFiles={hasAttachmentsByCard.get(card.id) ?? false}
                    onCardDragStart={setDraggedCardId}
                    onEngineerDrop={(cardId, engineerId, sourceCardId) =>
                      void handleEngineerDropOnCard(cardId, engineerId, sourceCardId)
                    }
                    onAssignedEngineerDragStart={(cardId, engineerId) =>
                      setDraggedAssignment({
                        engineerId,
                        sourceCardId: cardId
                      })
                    }
                    onAssignedEngineerDragEnd={() => setDraggedAssignment(null)}
                    onSelect={() => setActiveCard(card)}
                    onDelete={() => void deleteCard(card.id)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => openAddCardModal(column.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                <FaPlus className="h-3 w-3" />
                Add card
              </button>
            </div>
          );
        })}

        {activeCard ? (
          <CardModal
            card={activeCard}
            labels={labels}
            activeLabelIds={
              cardLabels
                .filter((item) => item.card_id === activeCard.id)
                .map((item) => item.label_id) ?? []
            }
            onAddLabel={(labelId) => addLabelToCard(activeCard.id, labelId)}
            onRemoveLabel={(labelId) =>
              removeLabelFromCard(activeCard.id, labelId)
            }
            onCreateLabel={async (name) => {
              const label = await createLabel(name);
              await addLabelToCard(activeCard.id, label.id);
            }}
            onAttachmentChanged={async () => {
              const response = await fetch(`/api/cards/${activeCard.id}/attachments`);
              const payload = (await response.json()) as {
                files?: (typeof initialData.cardFiles)[number][];
                links?: (typeof initialData.cardLinks)[number][];
              };
              if (response.ok) {
                setCardFiles((prev) => [
                  ...prev.filter((item) => item.card_id !== activeCard.id),
                  ...(payload.files ?? [])
                ]);
                setCardLinks((prev) => [
                  ...prev.filter((item) => item.card_id !== activeCard.id),
                  ...(payload.links ?? [])
                ]);
              }
            }}
            onClose={() => setActiveCard(null)}
          />
        ) : null}
      </section>
      {isAddCardModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Add card</h3>
              <button
                type="button"
                onClick={closeAddCardModal}
                className="text-sm text-slate-300 hover:text-slate-100"
                disabled={isCreatingCard}
              >
                Close
              </button>
            </div>
            <label className="mt-3 grid gap-2 text-sm">
              <span className="text-slate-300">Card name</span>
              <input
                value={newCardName}
                onChange={(event) => {
                  setNewCardName(event.target.value);
                  if (addCardError) {
                    setAddCardError(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitAddCard();
                  }
                }}
                placeholder="Untitled card"
                autoFocus
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-sky-400/40 placeholder:text-slate-500 focus:ring-2"
              />
            </label>
            {addCardError ? (
              <p className="mt-2 text-xs text-red-300">{addCardError}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAddCardModal}
                disabled={isCreatingCard}
                className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-slate-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitAddCard()}
                disabled={isCreatingCard}
                className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {isCreatingCard ? "Adding..." : "Add card"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <EngineerBar
        engineers={engineers}
        onAddEngineer={addEngineerByEmail}
        onUpdateEngineerProfile={updateEngineerProfile}
      />
      {draggedAssignment ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-rose-400/60 bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-100 shadow-lg">
          Drop anywhere outside a card to remove assignment
        </div>
      ) : null}
      {dropFeedback ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 shadow-lg">
          {dropFeedback}
        </div>
      ) : null}
    </div>
  );
}
