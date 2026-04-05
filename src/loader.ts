import path from "path";

const SUPPORTED_FORMATS = ["png", "jpeg", "jpg", "webp"];
const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024; // 50MB

type LocalResult = { kind: "local"; buffer: Buffer; basename: string; sourceDir: string };
type RemoteResult = { kind: "remote"; buffer: Buffer; basename: string };
export type LoadResult = LocalResult | RemoteResult;

type FetchFn = (url: string) => Promise<Response>;

function isUrl(input: string): boolean {
  return input.startsWith("https://") || input.startsWith("http://");
}

async function downloadImage(url: string, fetcher: FetchFn): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetcher(url);
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

export async function loadImage(input: string, fetcher: FetchFn = fetch): Promise<LoadResult> {
  if (isUrl(input)) {
    const buffer = await downloadImage(input, fetcher);
    const pathname = new URL(input).pathname;
    const filename = pathname.split("/").pop() || "image";
    const basename = filename.replace(/\.[^.]+$/, "");
    return { kind: "remote", buffer, basename };
  }

  const inputPath = path.resolve(input);
  const file = Bun.file(inputPath);

  if (!(await file.exists())) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const ext = path.extname(inputPath).slice(1).toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext)) {
    throw new Error(`Unsupported input format "${ext}". Supported: png, jpeg, jpg, webp`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const basename = path.basename(inputPath, path.extname(inputPath));
  const sourceDir = path.dirname(inputPath);

  return { kind: "local", buffer, basename, sourceDir };
}
