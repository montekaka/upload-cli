import { describe, test, expect } from "bun:test";
import { resolveOutputPath } from "../src/output-path";

describe("resolveOutputPath", () => {
  test("local source: resolves to sourceDir/basename.ext", () => {
    const result = resolveOutputPath("photo", "webp", { sourceDir: "/home/user/pics" });
    expect(result).toBe("/home/user/pics/photo.webp");
  });

  test("remote source: falls back to cwd when no sourceDir", () => {
    const result = resolveOutputPath("photo", "webp", { cwd: "/tmp/work" });
    expect(result).toBe("/tmp/work/photo.webp");
  });

  test("jpeg format uses .jpg extension", () => {
    const result = resolveOutputPath("photo", "jpeg", { sourceDir: "/tmp" });
    expect(result).toBe("/tmp/photo.jpg");
  });

  test("explicit --output override resolves to absolute path", () => {
    const result = resolveOutputPath("photo", "png", { output: "out/result.png", cwd: "/tmp/work" });
    expect(result).toBe("/tmp/work/out/result.png");
  });

  test("cwd option used when no sourceDir", () => {
    const result = resolveOutputPath("photo", "png", { cwd: "/custom" });
    expect(result).toBe("/custom/photo.png");
  });
});
