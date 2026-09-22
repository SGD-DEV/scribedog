/**
 * Built-in theme templates beyond Light and Dark. They use the custom theme
 * format but live here, not in the user's list: read-only like Light and
 * Dark (the builder offers "Duplicate"), and an app update that retunes one
 * reaches everyone using it. Palettes are our own; names are translated
 * (`themeBuilder.presets.<id>`), the `name` below is only the fallback.
 * presets.test.ts holds every one of them to minimum contrast ratios.
 */

import type { CustomTheme } from "./themeFormat";

export const PRESET_THEMES: readonly CustomTheme[] = [
  {
    // Muted cream page and brown ink: the classic for long writing sessions,
    // kept low in saturation so the page reads warm rather than coloured.
    id: "sepia",
    name: "Sepia",
    mode: "light",
    base: {
      background: "#e8e3d8",
      surface: "#f4f0e8",
      text: "#231e19",
      muted: "#685e51",
      chrome: "#928776",
      accent: "#996342"
    },
    zen: { background: "#f2ede4", text: "#231e19" }
  },
  {
    // Cool blue-grey dark, softer than the default dark.
    id: "fjord",
    name: "Fjord",
    mode: "dark",
    base: {
      background: "#0f1218",
      surface: "#171b22",
      text: "#dde3ec",
      muted: "#9aa4b5",
      chrome: "#7f899a",
      accent: "#4f89ad"
    }
  },
  {
    // Near-neutral dark grey surfaces with warm text and a toned-down copper
    // accent, for evening writing without blue in the picture; the paper
    // sheet matches Sepia.
    id: "fireside",
    name: "Fireside",
    mode: "dark",
    base: {
      background: "#161515",
      surface: "#1f1e1e",
      text: "#e1ded8",
      muted: "#a09c96",
      chrome: "#817f7e",
      accent: "#a86c44"
    },
    paper: { background: "#f2ede4", text: "#231e19" },
    zen: { background: "#131212", text: "#dad7d1" }
  },
  {
    // True black for OLED screens, surfaces a hair above it.
    id: "midnight",
    name: "Midnight",
    mode: "dark",
    base: {
      background: "#000000",
      surface: "#070708",
      text: "#e4e4e7",
      muted: "#9b9ba5",
      chrome: "#85858e",
      accent: "#7c62e8"
    },
    zen: { background: "#000000", text: "#d6d6dc" }
  }
];

export function findPresetTheme(id: string): CustomTheme | null {
  return PRESET_THEMES.find((preset) => preset.id === id) ?? null;
}
