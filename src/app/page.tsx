import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Gameplan</h1>
        <p className="mt-2 text-sm text-slate-300">
          Modern Kanban planner for delivery teams.
        </p>
        <Link
          href="/api/auth/webex"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Login with Webex
        </Link>
      </div>
    </main>
  );
}
