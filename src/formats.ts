export type Format = "png" | "jpeg" | "webp";

const ALIASES: Record<string, Format> = {
  png: "png",
  jpeg: "jpeg",
  jpg: "jpeg",
  webp: "webp",
};

export function parseFormat(input: string): Format | null {
  return ALIASES[input.toLowerCase()] ?? null;
}

export function mimeType(format: Format): string {
  const map: Record<Format, string> = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return map[format];
}

export function fileExtension(format: Format): string {
  const map: Record<Format, string> = {
    png: "png",
    jpeg: "jpg",
    webp: "webp",
  };
  return map[format];
}
