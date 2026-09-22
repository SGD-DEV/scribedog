/* Runs synchronously in <head>, before the first paint and long before the app
   bundle loads, so the window never flashes light on its way to the dark UI.
   Storage keys, class name and colours must stay in sync with
   src/store/useThemeStore.ts and the --body-bg-end tokens in
   src/styles/tokens.css. A custom theme or a shipped template cannot be
   derived here, so the store leaves its mode and root background under
   "scribedog-theme-boot". */
(function () {
  var BACKGROUNDS = { light: "#e9edf0", dark: "#090a0c" };

  var stored = null;
  var boot = null;
  try {
    stored = window.localStorage.getItem("scribedog-theme");
    if (stored && (stored.indexOf("custom:") === 0 || stored.indexOf("preset:") === 0)) {
      boot = JSON.parse(window.localStorage.getItem("scribedog-theme-boot") || "null");
    }
  } catch (error) {
    // localStorage may be unavailable in some environments.
  }

  var resolved;
  var background;
  if (
    boot &&
    (boot.mode === "light" || boot.mode === "dark") &&
    typeof boot.background === "string" &&
    /^#[0-9a-f]{6}$/i.test(boot.background)
  ) {
    resolved = boot.mode;
    background = boot.background;
  } else {
    resolved =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    background = BACKGROUNDS[resolved];
  }

  var root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  root.style.backgroundColor = background;
})();
