import type { FastifyInstance } from "fastify";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RequireSession } from "../auth/guard.js";
import { SERVER_META_DIR } from "../auth/authStore.js";

const BRANDING_FILE = "branding.json";
const UPLOADS_DIR = "uploads";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

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

export type BrandingRoutesOptions = {
  vaultPath: string;
  requireSession: RequireSession;
};

async function saveBrandingFile(vaultPath: string, data: BrandingData): Promise<void> {
  const metaDir = path.join(vaultPath, SERVER_META_DIR);
  await mkdir(metaDir, { recursive: true, mode: 0o700 });
  
  const brandingPath = path.join(metaDir, BRANDING_FILE);
  await writeFile(brandingPath, JSON.stringify(data, null, 2), { mode: 0o600 });
}

async function loadBrandingFile(vaultPath: string): Promise<BrandingData> {
  const brandingPath = path.join(vaultPath, SERVER_META_DIR, BRANDING_FILE);
  
  try {
    const content = await readFile(brandingPath, "utf8");
    return JSON.parse(content) as BrandingData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { 
        appName: "SYNDOC", 
        logoUrl: null, 
        faviconUrl: null,
        icons: {
          home: "home",
          folder: "folder",
          file: "description",
          settings: "settings",
          search: "search"
        }
      };
    }
    throw error;
  }
}

export async function brandingRoutes(app: FastifyInstance, options: BrandingRoutesOptions): Promise<void> {
  const { vaultPath, requireSession } = options;
  
  app.get("/branding", async (_request, reply) => {
    const data = await loadBrandingFile(vaultPath);
    return reply.send(data);
  });

  app.post(
    "/branding",
    {
      onRequest: requireSession
    },
    async (request, reply) => {
      const uploadsDir = path.join(vaultPath, SERVER_META_DIR, UPLOADS_DIR);
      await mkdir(uploadsDir, { recursive: true, mode: 0o700 });

      const branding = await loadBrandingFile(vaultPath);
      
      const parts = await request.parts();
      
      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "appName") {
            branding.appName = part.value.toString().trim() || "SYNDOC";
          } else if (part.fieldname === "icons") {
            try {
              const iconsData = JSON.parse(part.value.toString());
              branding.icons = iconsData;
            } catch {
              // Invalid JSON, ignore
            }
          }
        } else if (part.type === "file") {
          const fileBuffer = await part.toBuffer();
          
          if (fileBuffer.length > MAX_FILE_SIZE) {
            return reply.code(400).send({ error: "file_too_large", message: `${part.fieldname} file is too large.` });
          }

          if (part.fieldname === "logo") {
            const logoPath = path.join(uploadsDir, `logo-${Date.now()}${path.extname(part.filename)}`);
            await writeFile(logoPath, fileBuffer);
            branding.logoUrl = `/api/branding/uploads/${path.basename(logoPath)}`;
          } else if (part.fieldname === "favicon") {
            const faviconPath = path.join(uploadsDir, `favicon-${Date.now()}${path.extname(part.filename)}`);
            await writeFile(faviconPath, fileBuffer);
            branding.faviconUrl = `/api/branding/uploads/${path.basename(faviconPath)}`;
          }
        }
      }

      await saveBrandingFile(vaultPath, branding);

      return reply.send({ ok: true, branding });
    }
  );

  app.get("/branding/uploads/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const filePath = path.join(vaultPath, SERVER_META_DIR, UPLOADS_DIR, filename);
    
    try {
      const file = await readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = "application/octet-stream";
      if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".ico") contentType = "image/x-icon";
      
      return reply.type(contentType).send(file);
    } catch (error) {
      return reply.code(404).send({ error: "not_found", message: "File not found." });
    }
  });
}
