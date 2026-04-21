import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeSettingsForm } from "@/components/settings/ThemeSettingsForm";
import { UserMenu } from "@/components/layout/UserMenu";
import { getSessionFromCookies } from "@/lib/session";
import { getUserTheme } from "@/lib/users";

export default async function SettingsPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  const activeTheme = await getUserTheme(session.userId);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-xs text-slate-400">Personalize your workspace</p>
        </div>
        <UserMenu
          fullName={`${session.firstName} ${session.lastName}`}
          email={session.email}
          avatarUrl={session.avatarUrl}
        />
      </header>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Select one of 10 classic IDE-inspired themes.
          </p>
          <Link
            href="/board"
            className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Back to board
          </Link>
        </div>
        <ThemeSettingsForm initialThemeName={activeTheme} />
      </div>
    </main>
  );
}
