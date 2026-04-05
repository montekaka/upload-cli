const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024; // 50MB

export function isUrl(input: string): boolean {
  return input.startsWith("https://") || input.startsWith("http://");
}

export function deriveFilenameFromUrl(url: string, format: string): string {
  const pathname = new URL(url).pathname;
  const basename = pathname.split("/").pop() || "image";
  const nameWithoutExt = basename.replace(/\.[^.]+$/, "");
  const ext = format === "jpeg" ? "jpg" : format;
  return `${nameWithoutExt}.${ext}`;
}

export async function downloadImage(url: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Failed to download image from ${url}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to download image from ${url} (HTTP ${response.status})`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_SIZE) {
    throw new Error(`Download exceeds 50MB size limit`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_DOWNLOAD_SIZE) {
    throw new Error(`Download exceeds 50MB size limit`);
  }

  return buffer;
}
