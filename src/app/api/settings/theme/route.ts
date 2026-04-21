import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/route-auth";
import {
  DEFAULT_THEME,
  THEME_OPTIONS,
  VALID_THEME_IDS,
  type ThemeName
} from "@/lib/themes";
import { getUserTheme, updateUserTheme } from "@/lib/users";

const updateThemeSchema = z.object({
  themeName: z.enum(VALID_THEME_IDS as [ThemeName, ...ThemeName[]])
});

export async function GET() {
  try {
    const session = await requireSession();
    const themeName = await getUserTheme(session.userId);
    return NextResponse.json({
      themeName,
      themes: THEME_OPTIONS
    });
  } catch {
    return NextResponse.json(
      { themeName: DEFAULT_THEME, themes: THEME_OPTIONS },
      { status: 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const payload = updateThemeSchema.parse(await request.json());
    const themeName = await updateUserTheme(session.userId, payload.themeName);
    return NextResponse.json({ themeName });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
