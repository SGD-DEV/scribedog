// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_BASE_COLORS } from "@/lib/theme/derive";
import { findPresetTheme } from "@/lib/theme/presets";
import { resolveTheme, type CustomTheme } from "@/lib/theme/themeFormat";

// The store applies the selected theme at import, so every test imports a
// fresh copy after arranging localStorage.

const sepia: CustomTheme = {
  id: "theme-sepia",
  name: "Sepia",
  mode: "dark",
  base: { ...DEFAULT_BASE_COLORS.dark, surface: "#241d18", accent: "#e07b39" }
};

async function loadStore() {
  vi.resetModules();
  return (await import("./useThemeStore")).useThemeStore;
}

beforeEach(() => {
  window.localStorage.clear();
  document.head.innerHTML = "";
  document.documentElement.removeAttribute("style");
  document.documentElement.className = "";
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  })) as unknown as typeof window.matchMedia;
});

describe("useThemeStore with custom themes", () => {
  it("applies a saved custom theme to <html> and remembers it for the boot script", async () => {
    const store = await loadStore();
    store.getState().saveCustomTheme(sepia);
    store.getState().setTheme("custom:theme-sepia");

    const root = document.documentElement;
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.style.getPropertyValue("--surface-rgb")).toBe("36, 29, 24");
    expect(root.style.getPropertyValue("--accent-rgb")).toBe("224, 123, 57");
    expect(document.getElementById("scribedog-custom-theme")?.textContent).toContain(".editor-view__surface.prose");
    expect(JSON.parse(window.localStorage.getItem("scribedog-theme-boot") ?? "null")).toMatchObject({ mode: "dark" });
    expect(store.getState().resolvedTheme).toBe("dark");
  });

  it("clears every custom variable when switching back to a built-in theme", async () => {
    const store = await loadStore();
    store.getState().saveCustomTheme(sepia);
    store.getState().setTheme("custom:theme-sepia");
    store.getState().setTheme("light");

    const root = document.documentElement;
    expect(root.style.getPropertyValue("--surface-rgb")).toBe("");
    expect(root.classList.contains("dark")).toBe(false);
    expect(document.getElementById("scribedog-custom-theme")).toBeNull();
    expect(window.localStorage.getItem("scribedog-theme-boot")).toBeNull();
    // The accent colour setting takes over again.
    expect(root.style.getPropertyValue("--accent-rgb")).toBe("168, 85, 247");
  });

  it("restores the custom theme and the list after a restart", async () => {
    let store = await loadStore();
    store.getState().saveCustomTheme(sepia);
    store.getState().setTheme("custom:theme-sepia");

    store = await loadStore();
    expect(store.getState().theme).toBe("custom:theme-sepia");
    expect(store.getState().customThemes).toEqual([sepia]);
  });

  it("falls back to the theme's mode when the active custom theme is deleted", async () => {
    const store = await loadStore();
    store.getState().saveCustomTheme(sepia);
    store.getState().setTheme("custom:theme-sepia");
    store.getState().deleteCustomTheme("theme-sepia");

    expect(store.getState().theme).toBe("dark");
    expect(store.getState().customThemes).toEqual([]);
  });

  it("treats a stored reference to a missing theme as 'system'", async () => {
    window.localStorage.setItem("scribedog-theme", "custom:gone");
    const store = await loadStore();

    expect(store.getState().theme).toBe("system");
  });

  it("re-applies the active theme when it is saved again", async () => {
    const store = await loadStore();
    store.getState().saveCustomTheme(sepia);
    store.getState().setTheme("custom:theme-sepia");
    store.getState().saveCustomTheme({ ...sepia, base: { ...sepia.base, surface: "#302820" } });

    expect(document.documentElement.style.getPropertyValue("--surface-rgb")).toBe("48, 40, 32");
  });

  it("applies a shipped template by its preset key and restores it after a restart", async () => {
    let store = await loadStore();
    store.getState().setTheme("preset:sepia");

    expect(store.getState().resolvedTheme).toBe("light");
    const preset = findPresetTheme("sepia");
    expect(preset).not.toBeNull();
    expect(document.documentElement.style.getPropertyValue("--surface-rgb")).toBe(
      resolveTheme(preset as CustomTheme).root["--surface-rgb"]
    );
    expect(JSON.parse(window.localStorage.getItem("scribedog-theme-boot") ?? "null")).toMatchObject({ mode: "light" });

    store = await loadStore();
    expect(store.getState().theme).toBe("preset:sepia");
    // Templates are not copied into the user's list.
    expect(store.getState().customThemes).toEqual([]);
  });

  it("treats an unknown preset key as 'system'", async () => {
    window.localStorage.setItem("scribedog-theme", "preset:gone");
    const store = await loadStore();

    expect(store.getState().theme).toBe("system");
  });

  it("previews without selecting, and goes back on null", async () => {
    const store = await loadStore();
    store.getState().setTheme("light");
    store.getState().previewAppearance(sepia);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(store.getState().theme).toBe("light");

    store.getState().previewAppearance(null);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("scribedog-theme")).toBe("light");
  });
});
