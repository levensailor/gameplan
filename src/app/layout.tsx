import type { Metadata } from "next";
import "./globals.css";
import { getSessionFromCookies } from "@/lib/session";
import { getUserTheme } from "@/lib/users";
import { DEFAULT_THEME } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Gameplan",
  description: "Kanban planner for project delivery teams."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionFromCookies();
  const activeTheme = session ? await getUserTheme(session.userId) : DEFAULT_THEME;

  return (
    <html lang="en" data-theme={activeTheme}>
      <body>{children}</body>
    </html>
  );
}
