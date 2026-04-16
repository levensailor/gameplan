"use client";

import { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { CardItem } from "@/components/board/CardItem";
import { CardModal } from "@/components/board/CardModal";
import type { BoardSnapshot, PlannerCard } from "@/lib/types";

type Props = {
  initialData: BoardSnapshot;
};

export function Board({ initialData }: Props) {
  const [cards, setCards] = useState(initialData.cards);
  const [assignments, setAssignments] = useState(initialData.assignments);
  const [activeCard, setActiveCard] = useState<PlannerCard | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/webex/directory?sync=1");
  }, []);

  const engineerByCard = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const assignment of assignments) {
      const engineer = initialData.engineers.find(
        (item) => item.id === assignment.engineer_id
      );
      map.set(assignment.card_id, engineer?.avatar_url ?? null);
    }
    return map;
  }, [assignments, initialData.engineers]);

  async function addCard(columnId: string) {
    const name = window.prompt("Card name");
    if (!name) {
      return;
    }

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId, name })
    });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { card: PlannerCard };
    setCards((prev) => [...prev, payload.card]);
  }

  async function deleteCard(cardId: string) {
    const shouldDelete = window.confirm("Delete this card?");
    if (!shouldDelete) {
      return;
    }
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    setCards((prev) => prev.filter((card) => card.id !== cardId));
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
      body: JSON.stringify({ engineerId })
    });
    setAssignments((prev) => [
      ...prev.filter((item) => item.card_id !== cardId),
      { card_id: cardId, engineer_id: engineerId }
    ]);
  }

  return (
    <section className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-6">
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
                  engineerAvatar={engineerByCard.get(card.id)}
                  hasFiles={false}
                  onCardDragStart={setDraggedCardId}
                  onEngineerDrop={(cardId, engineerId) =>
                    void assignEngineer(cardId, engineerId)
                  }
                  onSelect={() => setActiveCard(card)}
                  onDelete={() => void deleteCard(card.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => void addCard(column.id)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              <FaPlus className="h-3 w-3" />
              Add card
            </button>
          </div>
        );
      })}

      {activeCard ? (
        <CardModal card={activeCard} onClose={() => setActiveCard(null)} />
      ) : null}
    </section>
  );
}
