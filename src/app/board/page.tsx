import { redirect } from "next/navigation";
import { Board } from "@/components/board/Board";
import { EngineerBar } from "@/components/layout/EngineerBar";
import { UserMenu } from "@/components/layout/UserMenu";
import { getBoardSnapshot } from "@/lib/board";
import { getSessionFromCookies } from "@/lib/session";

export default async function BoardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/");
  }

  const data = await getBoardSnapshot();

  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div>
          <h1 className="text-xl font-semibold">Gameplan Board</h1>
          <p className="text-xs text-slate-400">Single planner board</p>
        </div>
        <UserMenu
          fullName={`${session.firstName} ${session.lastName}`}
          email={session.email}
          avatarUrl={session.avatarUrl}
        />
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
        <Board initialData={data} />
      </div>
      <EngineerBar engineers={data.engineers} />
    </main>
  );
}
