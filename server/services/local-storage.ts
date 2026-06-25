import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { UserRole } from "@shared/schema";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), "data");

const SUBDIRS = ["uploads", "exports", "backups", "logs"] as const;

/** Idempotent — safe to call on every startup. */
export function initLocalStorage(): void {
  for (const sub of SUBDIRS) {
    const dir = path.join(STORAGE_ROOT, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  console.log(`[storage] Local storage initialised at ${STORAGE_ROOT}`);
}

export function isStorageConfigured(): boolean {
  return fs.existsSync(STORAGE_ROOT);
}

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tenantDir(tenantId: string): string {
  return path.join(STORAGE_ROOT, "uploads", tenantId);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Generates a UUID-based filename preserving the original extension. */
function uuidFilename(originalName: string): string {
  const ext = path.extname(originalName) || "";
  return `${randomUUID()}${ext}`;
}

// ---------------------------------------------------------------------------
// Role guards (carried over from old S3 service)
// ---------------------------------------------------------------------------

const UPLOAD_ROLES: UserRole[] = ["teacher", "hod", "admin", "super_admin"];
const DOWNLOAD_ROLES: UserRole[] = ["teacher", "hod", "exam_committee", "principal", "admin", "super_admin"];

export function canUpload(role: UserRole): boolean {
  return UPLOAD_ROLES.includes(role);
}

export function canDownload(role: UserRole): boolean {
  return DOWNLOAD_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for the old S3 service
// ---------------------------------------------------------------------------

export async function uploadFile(
  tenantId: string,
  category: string,
  filename: string,
  content: Buffer,
  _contentType: string,
  uploaderRole: UserRole,
  uploaderTenantId: string | null,
): Promise<{ key: string } | { error: string }> {
  if (!canUpload(uploaderRole)) {
    return { error: "Permission denied: role cannot upload files" };
  }
  if (uploaderRole !== "super_admin" && uploaderTenantId !== tenantId) {
    return { error: "Permission denied: tenant mismatch" };
  }

  const dir = path.join(tenantDir(tenantId), category);
  ensureDir(dir);

  const storedName = uuidFilename(filename);
  const fullPath = path.join(dir, storedName);

  try {
    fs.writeFileSync(fullPath, content);
    // Return a relative key that the download route can resolve
    const key = path.posix.join(tenantId, category, storedName);
    return { key };
  } catch (err: any) {
    console.error("[local-storage] upload error:", err);
    return { error: "Failed to write file to local storage" };
  }
}

export async function getDownloadPath(
  fileKey: string,
  downloaderRole: UserRole,
  downloaderTenantId: string | null,
): Promise<{ filePath: string } | { error: string }> {
  if (!canDownload(downloaderRole)) {
    return { error: "Permission denied: role cannot download files" };
  }

  const fullPath = path.join(STORAGE_ROOT, "uploads", fileKey);
  if (!fs.existsSync(fullPath)) {
    return { error: "File not found" };
  }

  return { filePath: fullPath };
}

export async function deleteFile(
  fileKey: string,
  deleterRole: UserRole,
  deleterTenantId: string | null,
): Promise<{ success: boolean } | { error: string }> {
  const adminRoles: UserRole[] = ["admin", "super_admin"];
  if (!adminRoles.includes(deleterRole)) {
    return { error: "Permission denied: only admins can delete files" };
  }

  const fullPath = path.join(STORAGE_ROOT, "uploads", fileKey);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return { success: true };
  } catch (err: any) {
    console.error("[local-storage] delete error:", err);
    return { error: "Failed to delete file" };
  }
}

export async function listFiles(
  tenantId: string,
  category: string,
): Promise<{ files: { key: string; size: number; lastModified: Date }[] } | { error: string }> {
  const dir = path.join(tenantDir(tenantId), category);
  if (!fs.existsSync(dir)) {
    return { files: [] };
  }
  try {
    const entries = fs.readdirSync(dir);
    const files = entries.map((name) => {
      const stat = fs.statSync(path.join(dir, name));
      return {
        key: path.posix.join(tenantId, category, name),
        size: stat.size,
        lastModified: stat.mtime,
      };
    });
    return { files };
  } catch (err: any) {
    console.error("[local-storage] list error:", err);
    return { error: "Failed to list files" };
  }
}

// ---------------------------------------------------------------------------
// High-level service object (matches old s3StorageService interface)
// ---------------------------------------------------------------------------

interface UploadParams {
  tenantId: string;
  examId: string;
  file: Buffer;
  fileName: string;
  fileType: string;
  uploadedBy: string;
}

interface DownloadParams {
  tenantId: string;
  examId: string;
  fileKey: string;
  expiresIn?: number;
}

interface DeleteParams {
  tenantId: string;
  examId: string;
  fileKey: string;
}

interface ListParams {
  tenantId: string;
  examId: string;
}

const localStorageService = {
  async uploadFile(params: UploadParams): Promise<{ key: string; location: string }> {
    const dir = path.join(tenantDir(params.tenantId), "exams", params.examId);
    ensureDir(dir);

    const storedName = uuidFilename(params.fileName);
    const fullPath = path.join(dir, storedName);
    fs.writeFileSync(fullPath, params.file);

    const key = storedName;
    const location = `local://${path.posix.join(params.tenantId, "exams", params.examId, storedName)}`;
    return { key, location };
  },

  async getDownloadFilePath(params: DownloadParams): Promise<string> {
    const fullPath = path.join(tenantDir(params.tenantId), "exams", params.examId, params.fileKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error("File not found");
    }
    return fullPath;
  },

  async deleteFile(params: DeleteParams): Promise<void> {
    const fullPath = path.join(tenantDir(params.tenantId), "exams", params.examId, params.fileKey);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  },

  async listFiles(params: ListParams): Promise<{ key: string; size: number; lastModified: Date }[]> {
    const dir = path.join(tenantDir(params.tenantId), "exams", params.examId);
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir);
    return entries.map((name) => {
      const stat = fs.statSync(path.join(dir, name));
      return { key: name, size: stat.size, lastModified: stat.mtime };
    });
  },
};

export default localStorageService;
