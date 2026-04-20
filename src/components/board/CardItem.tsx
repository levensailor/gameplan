"use client";

import { format } from "date-fns";
import { FaPaperclip, FaTrash } from "react-icons/fa";
import type { CardLabel, PlannerCard } from "@/lib/types";

type AssignedEngineer = {
  engineerId: string;
  avatarUrl: string;
  label: string;
};

type Props = {
  card: PlannerCard;
  labels: CardLabel[];
  assignedEngineers: AssignedEngineer[];
  hasFiles: boolean;
  onCardDragStart: (cardId: string) => void;
  onEngineerDrop: (
    cardId: string,
    engineerId: string,
    sourceCardId?: string
  ) => void;
  onAssignedEngineerDragStart: (cardId: string, engineerId: string) => void;
  onAssignedEngineerDragEnd: () => void;
  onSelect: () => void;
  onDelete: () => void;
};

export function CardItem({
  card,
  labels,
  assignedEngineers,
  hasFiles,
  onCardDragStart,
  onEngineerDrop,
  onAssignedEngineerDragStart,
  onAssignedEngineerDragEnd,
  onSelect,
  onDelete
}: Props) {
  return (
    <article
      data-card-drop-zone="true"
      draggable
      onDragStart={() => onCardDragStart(card.id)}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload =
          event.dataTransfer.getData("application/x-gameplan-assignment") ||
          event.dataTransfer.getData("application/x-gameplan-engineer");
        if (payload) {
          let engineerId = payload;
          let sourceCardId: string | undefined;
          try {
            const parsed = JSON.parse(payload) as {
              engineerId?: string;
              sourceCardId?: string;
            };
            if (parsed.engineerId) {
              engineerId = parsed.engineerId;
            }
            sourceCardId = parsed.sourceCardId;
          } catch {
            // Keep legacy plain-string format.
          }
          onEngineerDrop(card.id, engineerId, sourceCardId);
        }
      }}
      onClick={onSelect}
      className="cursor-pointer rounded-md border border-slate-700 bg-slate-800 p-3 shadow-sm transition hover:border-slate-500"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold">{card.name}</h4>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="text-slate-400 hover:text-red-300"
          aria-label="Delete card"
        >
          <FaTrash className="h-3.5 w-3.5" />
        </button>
      </div>
      {labels.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={`${card.id}:${label.id}`}
              className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200"
              style={{ backgroundColor: `${label.color_hex}33` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      ) : null}
      {hasFiles ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
            <FaPaperclip className="h-3 w-3" />
            Attachments
          </span>
        </div>
      ) : null}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-1">
          {assignedEngineers.map((engineer) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${card.id}:${engineer.engineerId}`}
              src={engineer.avatarUrl}
              alt={engineer.label}
              draggable
              onDragStart={(event) => {
                event.stopPropagation();
                event.dataTransfer.setData(
                  "application/x-gameplan-assignment",
                  JSON.stringify({
                    engineerId: engineer.engineerId,
                    sourceCardId: card.id
                  })
                );
                onAssignedEngineerDragStart(card.id, engineer.engineerId);
              }}
              onDragEnd={onAssignedEngineerDragEnd}
              className="h-5 w-5 rounded-full border border-slate-600"
            />
          ))}
        </div>
        {card.project_code ? <span>{card.project_code}</span> : null}
        <span>{format(new Date(card.created_at), "M/d")}</span>
      </div>
    </article>
  );
}
