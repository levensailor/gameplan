"use client";

import type { EngineerSummary } from "@/lib/types";
import { FaUserCircle } from "react-icons/fa";

type Props = {
  engineers: EngineerSummary[];
};

export function EngineerBar({ engineers }: Props) {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/90 p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
        Engineers
      </p>
      <div className="flex flex-wrap gap-2">
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
    </footer>
  );
}
