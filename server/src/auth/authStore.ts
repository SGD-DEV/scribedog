import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { assertPasswordPolicy, hashPassword, verifyPassword } from "./password.js";

/**
 * Where the server keeps its own state inside the vault. `.scribedog/` is the
 * same metadata directory the desktop app uses for versions and checkpoints
 * (and skips when listing notes); `server/` underneath keeps the two apart.
 */
export const SERVER_META_DIR = path.join(".scribedog", "server");
const AUTH_FILE_NAME = "auth.json";
const SESSION_SECRET_FILE_NAME = "session-secret";
const SESSION_SECRET_BYTES = 32;

type AuthFile = {
  version: 1;
  username: string;
  passwordHash: string;
  /**
   * Every session token carries the epoch it was issued under. Changing the
   * password bumps this counter, which invalidates every existing session at
   * once without a server-side session store.
   */
  sessionEpoch: number;
  updatedAt: string;
};

export class AuthSetupError extends Error {}

async function writeFileAtomically(filePath: string, content: string | Buffer): Promise<void> {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, content, { mode: 0o600 });
  await rename(tempPath, filePath);
}

async function readJsonIfExists(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function isAuthFile(value: unknown): value is AuthFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.version === 1 &&
    typeof candidate.username === "string" &&
    candidate.username.length > 0 &&
    typeof candidate.passwordHash === "string" &&
    candidate.passwordHash.length > 0 &&
    typeof candidate.sessionEpoch === "number" &&
    Number.isInteger(candidate.sessionEpoch)
  );
}

type LegacyAuthFile = Omit<AuthFile, "username">;

/** An auth file from before usernames: everything valid except the missing username. */
function isLegacyAuthFile(value: unknown): value is LegacyAuthFile {
  return (
    !!value &&
    typeof value === "object" &&
    !("username" in value) &&
    isAuthFile({ ...(value as Record<string, unknown>), username: "legacy" })
  );
}

function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 64;
}

export type AuthStore = {
  /** Secret behind the HMAC on session tokens; generated once per vault. */
  readonly sessionSecret: Buffer;
  /**
   * Read on every request through the guard, so it has to be a live value:
   * changing the password bumps it and every token issued under the old epoch
   * stops verifying.
   */
  readonly sessionEpoch: number;
  verifyCredentials(username: string, password: string): Promise<boolean>;
  verifyPassword(password: string): Promise<boolean>;
  /**
   * Replaces the password and bumps the session epoch. The caller has already
   * verified the current password (and re-wrapped the stored API keys, see
   * secrets/secretStore.ts) by the time this runs.
   */
  changePassword(newPassword: string): Promise<void>;
};

export type OpenAuthStoreOptions = {
  vaultPath: string;
  initUsername: string | null;
  initPassword: string | null;
  log: { info(message: string): void; warn(message: string): void };
};

/**
 * Loads (or on first start creates) the password hash and the session secret.
 *
 * The init password only ever creates a hash that does not exist yet. If a
 * hash is already there the variable is ignored and we say so in the log, so
 * that a compose file that still carries the variable cannot silently reset
 * the password on every redeploy.
 */
export async function openAuthStore(options: OpenAuthStoreOptions): Promise<AuthStore> {
  const metaDir = path.join(options.vaultPath, SERVER_META_DIR);
  await mkdir(metaDir, { recursive: true, mode: 0o700 });

  const authFilePath = path.join(metaDir, AUTH_FILE_NAME);
  const secretFilePath = path.join(metaDir, SESSION_SECRET_FILE_NAME);

  let sessionSecret: Buffer;

  try {
    sessionSecret = Buffer.from((await readFile(secretFilePath, "utf8")).trim(), "hex");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    sessionSecret = randomBytes(SESSION_SECRET_BYTES);
    await writeFileAtomically(secretFilePath, sessionSecret.toString("hex"));
    options.log.info("Generated a new session secret.");
  }

  if (sessionSecret.length < 16) {
    throw new AuthSetupError(`${secretFilePath} is not a valid session secret. Delete the file to have a new one generated.`);
  }

  const existing = await readJsonIfExists(authFilePath);
  let authFile: AuthFile;

  if (existing !== null) {
    if (isAuthFile(existing)) {
      authFile = existing;
    } else if (isLegacyAuthFile(existing)) {
      // Written before logins had a username. Keep the password hash and the
      // session epoch, take the username from SCRIBEDOG_INIT_USERNAME.
      if (options.initUsername === null || !isValidUsername(options.initUsername)) {
        throw new AuthSetupError(
          `${authFilePath} has no username yet. Set SCRIBEDOG_INIT_USERNAME (3 to 64 characters) to add one; the password stays the same.`
        );
      }

      authFile = { ...existing, username: options.initUsername, updatedAt: new Date().toISOString() };
      await writeFileAtomically(authFilePath, `${JSON.stringify(authFile, null, 2)}\n`);
      options.log.info("Added the username from SCRIBEDOG_INIT_USERNAME to the existing credentials.");
    } else {
      throw new AuthSetupError(`${authFilePath} is not a valid auth file.`);
    }

    if (options.initPassword !== null) {
      options.log.warn(
        "SCRIBEDOG_INIT_PASSWORD is set but ignored because a password already exists. You can remove the variable from your compose file."
      );
    }
  } else {
    if (options.initUsername === null || options.initPassword === null) {
      throw new AuthSetupError(
        "No credentials have been set for this vault yet. Set SCRIBEDOG_INIT_USERNAME and SCRIBEDOG_INIT_PASSWORD for the first start (they are only used until credentials exist)."
      );
    }

    if (!isValidUsername(options.initUsername)) {
      throw new AuthSetupError("SCRIBEDOG_INIT_USERNAME must be between 3 and 64 characters.");
    }

    try {
      assertPasswordPolicy(options.initPassword);
    } catch (error) {
      throw new AuthSetupError(`SCRIBEDOG_INIT_PASSWORD rejected: ${(error as Error).message}`);
    }

    authFile = {
      version: 1,
      username: options.initUsername,
      passwordHash: await hashPassword(options.initPassword),
      sessionEpoch: 1,
      updatedAt: new Date().toISOString()
    };
    await writeFileAtomically(authFilePath, `${JSON.stringify(authFile, null, 2)}\n`);
    options.log.info("Initial credentials stored from SCRIBEDOG_INIT_USERNAME and SCRIBEDOG_INIT_PASSWORD. The variables can now be removed.");
  }

  let current = authFile;

  return {
    sessionSecret,
    get sessionEpoch() {
      return current.sessionEpoch;
    },
    async verifyCredentials(username: string, password: string): Promise<boolean> {
      if (username !== current.username) {
        return false;
      }
      return verifyPassword(password, current.passwordHash);
    },
    async verifyPassword(password: string): Promise<boolean> {
      return verifyPassword(password, current.passwordHash);
    },
    async changePassword(newPassword: string) {
      assertPasswordPolicy(newPassword);

      const next: AuthFile = {
        version: 1,
        username: current.username,
        passwordHash: await hashPassword(newPassword),
        sessionEpoch: current.sessionEpoch + 1,
        updatedAt: new Date().toISOString()
      };

      await writeFileAtomically(authFilePath, `${JSON.stringify(next, null, 2)}\n`);
      current = next;
    }
  };
}
