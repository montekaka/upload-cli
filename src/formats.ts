export type Format = "png" | "jpeg" | "webp";

const ALIAS_MAP: Record<string, Format> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
};

const MIME_MAP: Record<Format, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const FORMATS: readonly Format[] = ["png", "jpeg", "webp"];

export const INPUT_EXTENSIONS: readonly (Format | "jpg")[] = ["png", "jpeg", "jpg", "webp"];

// Validates and normalizes in one call. Returns null for unknown values.
// "jpg" → "jpeg", "bmp" → null
export function parseFormat(raw: string): Format | null {
  return ALIAS_MAP[raw] ?? null;
}

// Returns true for all valid input file extensions (includes "jpg" alias)
export function isSupportedExtension(ext: string): boolean {
  return (INPUT_EXTENSIONS as readonly string[]).includes(ext);
}

// Resolves MIME type for a canonical Format. Only accepts Format — passing "jpg" is a compile error.
export function mimeType(format: Format): string {
  return MIME_MAP[format];
}
