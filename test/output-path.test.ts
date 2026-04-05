import { describe, test, expect } from "bun:test";
import { resolveOutputPath } from "../src/output-path";
import type { LoadResult } from "../src/loader";

const localImage: LoadResult = {
  kind: "local",
  buffer: Buffer.alloc(0),
  basename: "photo",
  sourceDir: "/home/user/images",
};

const remoteImage: LoadResult = {
  kind: "remote",
  buffer: Buffer.alloc(0),
  basename: "photo",
};

describe("resolveOutputPath", () => {
  test("local image saves next to source file with new extension", () => {
    const result = resolveOutputPath(localImage, "png");
    expect(result).toBe("/home/user/images/photo.png");
  });

  test("remote image saves in CWD with new extension", () => {
    const result = resolveOutputPath(remoteImage, "png", { cwd: "/tmp/work" });
    expect(result).toBe("/tmp/work/photo.png");
  });

  test("--output override resolves to an absolute path", () => {
    const result = resolveOutputPath(localImage, "png", { output: "out/converted.png", cwd: "/tmp/work" });
    expect(result).toBe("/tmp/work/out/converted.png");
  });

  test("jpeg format uses .jpg extension", () => {
    const result = resolveOutputPath(localImage, "jpeg");
    expect(result).toBe("/home/user/images/photo.jpg");
  });

  test("png and webp formats use their own extension", () => {
    expect(resolveOutputPath(localImage, "png")).toBe("/home/user/images/photo.png");
    expect(resolveOutputPath(localImage, "webp")).toBe("/home/user/images/photo.webp");
  });
});
