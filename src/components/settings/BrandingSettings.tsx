import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { IconPicker } from "@/components/icons/IconPicker";
import { InfoPopover } from "@/components/settings/InfoPopover";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { platform } from "@/platform";

type BrandingData = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  icons?: {
    home?: string;
    folder?: string;
    file?: string;
    settings?: string;
    search?: string;
  };
};

export function BrandingSettings() {
  const { t } = useTranslation();
  const [appName, setAppName] = useState("SYNDOC");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [icons, setIcons] = useState({
    home: "home",
    folder: "folder",
    file: "description",
    settings: "settings",
    search: "search"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const response = await platform.http.fetch("/api/branding");
      if (response.ok) {
        const data: BrandingData = await response.json();
        setAppName(data.appName || "SYNDOC");
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
        if (data.faviconUrl) {
          setFaviconPreview(data.faviconUrl);
        }
        if (data.icons) {
          setIcons({
            home: data.icons.home || "home",
            folder: data.icons.folder || "folder",
            file: data.icons.file || "description",
            settings: data.icons.settings || "settings",
            search: data.icons.search || "search"
          });
        }
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const formData = new FormData();
      formData.append("appName", appName);
      formData.append("icons", JSON.stringify(icons));
      
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      
      if (faviconFile) {
        formData.append("favicon", faviconFile);
      }

      const response = await platform.http.fetch("/api/branding", {
        method: "POST",
        body: formData as unknown as BodyInit
      });

      if (response.ok) {
        setSaveStatus("success");
        setLogoFile(null);
        setFaviconFile(null);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Failed to save branding:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  const hasChanges = logoFile !== null || faviconFile !== null || appName !== "SYNDOC" || 
    JSON.stringify(icons) !== JSON.stringify({ home: "home", folder: "folder", file: "description", settings: "settings", search: "search" });

  return (
    <SettingsPage>
      <h2 className="sgd-settings-heading">{t("settingsDialog.brandingTitle")}</h2>
      <p className="sgd-settings-lead">{t("settingsDialog.brandingDescription")}</p>

      <SettingRow
        label={t("settingsDialog.brandingAppName")}
        info={
          <InfoPopover title={t("settingsDialog.brandingAppName")}>
            {t("settingsDialog.brandingAppNameHint")}
          </InfoPopover>
        }
      >
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="sgd-settings-input"
          placeholder="SYNDOC"
          maxLength={32}
        />
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingLogo")}
        info={
          <InfoPopover title={t("settingsDialog.brandingLogo")}>
            {t("settingsDialog.brandingLogoHint")}
          </InfoPopover>
        }
      >
        <div className="sgd-branding-upload">
          {logoPreview ? (
            <div className="sgd-branding-preview">
              <img src={logoPreview} alt="Logo Preview" className="sgd-branding-preview-image" />
              <button
                type="button"
                onClick={removeLogo}
                className="sgd-branding-remove"
                aria-label={t("settingsDialog.brandingRemove")}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="sgd-branding-upload-button"
            >
              <Upload size={20} />
              <span>{t("settingsDialog.brandingUpload")}</span>
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            onChange={handleLogoChange}
            className="sgd-branding-file-input"
          />
        </div>
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingFavicon")}
        info={
          <InfoPopover title={t("settingsDialog.brandingFavicon")}>
            {t("settingsDialog.brandingFaviconHint")}
          </InfoPopover>
        }
      >
        <div className="sgd-branding-upload">
          {faviconPreview ? (
            <div className="sgd-branding-preview">
              <img src={faviconPreview} alt="Favicon Preview" className="sgd-branding-preview-icon" />
              <button
                type="button"
                onClick={removeFavicon}
                className="sgd-branding-remove"
                aria-label={t("settingsDialog.brandingRemove")}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => faviconInputRef.current?.click()}
              className="sgd-branding-upload-button"
            >
              <Upload size={20} />
              <span>{t("settingsDialog.brandingUpload")}</span>
            </button>
          )}
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/svg+xml,image/png,image/x-icon"
            onChange={handleFaviconChange}
            className="sgd-branding-file-input"
          />
        </div>
      </SettingRow>

      <h3 className="sgd-settings-heading" style={{ marginTop: "2rem" }}>
        {t("settingsDialog.brandingIconsTitle")}
      </h3>
      <p className="sgd-settings-lead">{t("settingsDialog.brandingIconsDescription")}</p>

      <SettingRow
        label={t("settingsDialog.brandingIconHome")}
        info={
          <InfoPopover title={t("settingsDialog.brandingIconHome")}>
            {t("settingsDialog.brandingIconHomeHint")}
          </InfoPopover>
        }
      >
        <IconPicker
          value={icons.home}
          onChange={(icon) => setIcons({ ...icons, home: icon })}
          label={icons.home}
        />
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingIconFolder")}
        info={
          <InfoPopover title={t("settingsDialog.brandingIconFolder")}>
            {t("settingsDialog.brandingIconFolderHint")}
          </InfoPopover>
        }
      >
        <IconPicker
          value={icons.folder}
          onChange={(icon) => setIcons({ ...icons, folder: icon })}
          label={icons.folder}
        />
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingIconFile")}
        info={
          <InfoPopover title={t("settingsDialog.brandingIconFile")}>
            {t("settingsDialog.brandingIconFileHint")}
          </InfoPopover>
        }
      >
        <IconPicker
          value={icons.file}
          onChange={(icon) => setIcons({ ...icons, file: icon })}
          label={icons.file}
        />
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingIconSettings")}
        info={
          <InfoPopover title={t("settingsDialog.brandingIconSettings")}>
            {t("settingsDialog.brandingIconSettingsHint")}
          </InfoPopover>
        }
      >
        <IconPicker
          value={icons.settings}
          onChange={(icon) => setIcons({ ...icons, settings: icon })}
          label={icons.settings}
        />
      </SettingRow>

      <SettingRow
        label={t("settingsDialog.brandingIconSearch")}
        info={
          <InfoPopover title={t("settingsDialog.brandingIconSearch")}>
            {t("settingsDialog.brandingIconSearchHint")}
          </InfoPopover>
        }
      >
        <IconPicker
          value={icons.search}
          onChange={(icon) => setIcons({ ...icons, search: icon })}
          label={icons.search}
        />
      </SettingRow>

      <div className="sgd-settings-actions">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? t("common.saving") : t("common.save")}
        </Button>
        {saveStatus === "success" && (
          <span className="sgd-branding-status sgd-branding-status--success">
            {t("settingsDialog.brandingSaved")}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="sgd-branding-status sgd-branding-status--error">
            {t("settingsDialog.brandingError")}
          </span>
        )}
      </div>
    </SettingsPage>
  );
}
