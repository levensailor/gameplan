import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gameplan",
  description: "Kanban planner for project delivery teams."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
