import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import syndocLogoAnimated from "@/assets/syndoc-logo-animated.svg";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { useSessionStore } from "@/store/useSessionStore";

type LoginViewProps = {
  /**
   * True while the app underneath is still mounted: the session ran out
   * mid-session, the form sits on top, and signing in again continues where
   * the user left off (unsaved edits included).
   */
  isOverlay: boolean;
};

/**
 * The password form of the server edition. One password, no user name: the
 * instance belongs to one person (see server/README.md).
 */
export function LoginView({ isOverlay }: LoginViewProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const login = useSessionStore((state) => state.login);
  const loginError = useSessionStore((state) => state.loginError);
  const isLoggingIn = useSessionStore((state) => state.isLoggingIn);
  const status = useSessionStore((state) => state.status);
  const branding = useBranding();

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!username || !password || isLoggingIn) {
      return;
    }

    const ok = await login(username, password);

    if (ok) {
      setUsername("");
      setPassword("");
    } else {
      usernameRef.current?.select();
    }
  };

  return (
    <div className="login-view ai-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <form className="ai-dialog__panel login-view__panel" onSubmit={(event) => void handleSubmit(event)}>
        <img className="login-view__logo" src={branding.logoUrl || syndocLogoAnimated} alt="" aria-hidden="true" />
        <h1 id="login-title" className="login-view__title">
          {t("login.title")}
        </h1>
        <p className="login-view__lead">{isOverlay ? t("login.sessionExpired") : t("login.lead")}</p>
        <label className="ai-dialog__field">
          <span>{t("login.username")}</span>
          <input
            ref={usernameRef}
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isLoggingIn}
            data-testid="username"
          />
        </label>
        <label className="ai-dialog__field">
          <span>{t("login.password")}</span>
          <input
            ref={passwordRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoggingIn}
            data-testid="password"
          />
        </label>
        {loginError ? (
          <p className="login-view__error" role="alert">
            {loginError}
          </p>
        ) : status === "unreachable" ? (
          <p className="login-view__error" role="alert">
            {t("login.serverUnreachable")}
          </p>
        ) : null}
        <Button type="submit" disabled={!username || !password || isLoggingIn} data-testid="login">
          {isLoggingIn ? t("login.signingIn") : t("login.submit")}
        </Button>
      </form>
    </div>
  );
}
