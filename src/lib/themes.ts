export const DEFAULT_THEME = "vscode-dark-plus" as const;

export const THEME_OPTIONS = [
  {
    id: "vscode-dark-plus",
    label: "VS Code Dark+",
    mode: "dark",
    description: "Balanced contrast with blue accents."
  },
  {
    id: "dracula",
    label: "Dracula",
    mode: "dark",
    description: "Purple-forward dark palette with neon accents."
  },
  {
    id: "monokai-pro",
    label: "Monokai Pro",
    mode: "dark",
    description: "Warm dark background with vivid highlights."
  },
  {
    id: "nord-night",
    label: "Nord Night",
    mode: "dark",
    description: "Cool arctic tones with soft contrast."
  },
  {
    id: "solarized-dark",
    label: "Solarized Dark",
    mode: "dark",
    description: "Muted dark tones optimized for long sessions."
  },
  {
    id: "github-light",
    label: "GitHub Light",
    mode: "light",
    description: "Clean, neutral light palette."
  },
  {
    id: "quiet-light",
    label: "Quiet Light",
    mode: "light",
    description: "Soft light theme inspired by VS Code."
  },
  {
    id: "one-light",
    label: "One Light",
    mode: "light",
    description: "Gentle contrast with modern accent tones."
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    mode: "light",
    description: "Warm low-contrast light palette."
  },
  {
    id: "xcode-light",
    label: "Xcode Light",
    mode: "light",
    description: "Bright Apple-inspired light styling."
  }
] as const;

export type ThemeName = (typeof THEME_OPTIONS)[number]["id"];

export const VALID_THEME_IDS = THEME_OPTIONS.map((theme) => theme.id);

export function isValidThemeName(value: string): value is ThemeName {
  return VALID_THEME_IDS.includes(value as ThemeName);
}
