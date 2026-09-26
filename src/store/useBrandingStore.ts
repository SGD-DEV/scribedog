import { create } from "zustand";

type BrandingIcons = {
  home: string;
  folder: string;
  file: string;
  settings: string;
  search: string;
};

type BrandingState = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  icons: BrandingIcons;
  loadBranding: () => Promise<void>;
};

const DEFAULT_ICONS: BrandingIcons = {
  home: "home",
  folder: "folder",
  file: "description",
  settings: "settings",
  search: "search"
};

export const useBrandingStore = create<BrandingState>((set) => ({
  appName: "SYNDOC",
  logoUrl: null,
  faviconUrl: null,
  icons: DEFAULT_ICONS,

  loadBranding: async () => {
    try {
      const response = await fetch("/api/branding");
      if (response.ok) {
        const data = await response.json();
        set({
          appName: data.appName || "SYNDOC",
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
          icons: data.icons || DEFAULT_ICONS
        });

        if (data.appName) {
          document.title = data.appName;
        }

        if (data.faviconUrl) {
          const link: HTMLLinkElement =
            document.querySelector("link[rel='icon']") || document.createElement("link");
          link.rel = "icon";
          link.href = data.faviconUrl;
          if (!document.querySelector("link[rel='icon']")) {
            document.head.appendChild(link);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }
  }
}));
