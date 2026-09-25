import { useEffect, useState } from "react";
import { platform } from "@/platform";

type BrandingData = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

const DEFAULT_BRANDING: BrandingData = {
  appName: "SYNDOC",
  logoUrl: null,
  faviconUrl: null
};

export function useBranding(): BrandingData {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch("/api/branding");
        if (response.ok) {
          const data: BrandingData = await response.json();
          setBranding(data);
          
          if (data.appName) {
            document.title = data.appName;
          }
          
          if (data.faviconUrl) {
            const link: HTMLLinkElement = document.querySelector("link[rel='icon']") || document.createElement("link");
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
    };

    loadBranding();
  }, []);

  return branding;
}
