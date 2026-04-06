import path from "path";
import type { Format } from "./formats";

export function resolveOutputPath(
  basename: string,
  format: Format,
  options?: { output?: string; sourceDir?: string; cwd?: string }
): string {
  if (options?.output) {
    const cwd = options.cwd ?? process.cwd();
    return path.resolve(cwd, options.output);
  }

  const ext = format === "jpeg" ? "jpg" : format;
  const base = options?.sourceDir ?? options?.cwd ?? process.cwd();
  return path.join(base, `${basename}.${ext}`);
}
