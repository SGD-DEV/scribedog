import { useEffect } from "react";
import { useBrandingStore } from "@/store/useBrandingStore";

export function useBranding() {
  const { appName, logoUrl, faviconUrl, icons, loadBranding } = useBrandingStore();

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  return { appName, logoUrl, faviconUrl, icons };
}
