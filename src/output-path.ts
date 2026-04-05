import path from "path";
import type { LoadResult } from "./loader";
import type { Format } from "./processor";

export function resolveOutputPath(
  image: LoadResult,
  format: Format,
  options?: { output?: string; cwd?: string }
): string {
  if (options?.output) {
    const cwd = options.cwd ?? process.cwd();
    return path.resolve(cwd, options.output);
  }

  const ext = format === "jpeg" ? "jpg" : format;

  if (image.kind === "remote") {
    const cwd = options?.cwd ?? process.cwd();
    return path.join(cwd, `${image.basename}.${ext}`);
  }

  return path.join(image.sourceDir, `${image.basename}.${ext}`);
}
