import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Gameplan</h1>
        <p className="mt-2 text-sm text-slate-300">
          Modern Kanban planner for delivery teams.
        </p>
        {error === "db_setup_required" ? (
          <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
            Database schema is not initialized. Run SQL scripts in order:
            <br />
            <code>sql/001_init_schema.sql</code>
            <br />
            <code>sql/002_seed_defaults.sql</code>
            <br />
            <code>sql/003_webex_directory_cache.sql</code>
          </p>
        ) : null}
        {error === "oauth_failed" ? (
          <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            Login failed during OAuth callback. Please retry and check server logs.
          </p>
        ) : null}
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
