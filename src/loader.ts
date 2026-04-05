import path from "path";
import { isUrl, downloadImage } from "./url";

const SUPPORTED_FORMATS = ["png", "jpeg", "jpg", "webp"];

type LocalResult = { kind: "local"; buffer: Buffer; basename: string; sourceDir: string };
type RemoteResult = { kind: "remote"; buffer: Buffer; basename: string };
export type LoadResult = LocalResult | RemoteResult;

export async function loadImage(input: string): Promise<LoadResult> {
  if (isUrl(input)) {
    const buffer = await downloadImage(input);
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
