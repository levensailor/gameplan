"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  THEME_OPTIONS,
  type ThemeName
} from "@/lib/themes";

type Props = {
  initialThemeName: ThemeName;
};

export function ThemeSettingsForm({ initialThemeName }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(initialThemeName);
  const [savedTheme, setSavedTheme] = useState<ThemeName>(initialThemeName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const hasUnsavedChanges = useMemo(
    () => selectedTheme !== savedTheme,
    [savedTheme, selectedTheme]
  );

  async function saveTheme() {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName: selectedTheme })
      });
      const payload = (await response.json()) as {
        themeName?: ThemeName;
        error?: string;
      };

      if (!response.ok || !payload.themeName) {
        throw new Error(payload.error ?? "Failed to save theme");
      }

      setSavedTheme(payload.themeName);
      document.documentElement.setAttribute("data-theme", payload.themeName);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save theme"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="text-sm text-slate-400">
          Choose an IDE-inspired look for your board.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {THEME_OPTIONS.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => {
              setSelectedTheme(theme.id);
              setError(null);
              document.documentElement.setAttribute("data-theme", theme.id);
            }}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              selectedTheme === theme.id
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-700 bg-slate-900 hover:border-slate-500"
            }`}
          >
            <p className="text-sm font-semibold">{theme.label}</p>
            <p className="text-xs text-slate-400">{theme.description}</p>
            <span className="mt-2 inline-flex rounded-full border border-slate-600 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
              {theme.mode}
            </span>
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedTheme(savedTheme);
            setError(null);
            document.documentElement.setAttribute("data-theme", savedTheme);
          }}
          disabled={!hasUnsavedChanges || isSaving}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => void saveTheme()}
          disabled={!hasUnsavedChanges || isSaving}
          className="rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save theme"}
        </button>
      </div>
    </section>
  );
}
