"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaChevronDown, FaUserCircle } from "react-icons/fa";

type Props = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({ fullName, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={fullName} className="h-7 w-7 rounded-full" />
        ) : (
          <FaUserCircle className="h-7 w-7 text-slate-300" />
        )}
        <FaChevronDown className="text-xs text-slate-300" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-slate-700 bg-slate-800 p-3 shadow-xl">
          <p className="text-sm font-medium">{fullName}</p>
          <p className="text-xs text-slate-400">{email}</p>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-3 block w-full rounded-md border border-slate-600 px-3 py-1.5 text-left text-sm hover:bg-slate-700"
          >
            Personal Settings
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-md border border-red-500/30 px-3 py-1.5 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
