import { test, expect, describe, beforeAll, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";

const BINARY = path.resolve("dist/upload-cli");
const FIXTURES = path.resolve("test/fixtures");
const TMP = path.resolve("test/tmp-binary");

async function ensureTmp() {
  await fs.mkdir(TMP, { recursive: true });
}

async function copyFixture(name: string): Promise<string> {
  await ensureTmp();
  const src = path.join(FIXTURES, name);
  const dest = path.join(TMP, name);
  await fs.copyFile(src, dest);
  return dest;
}

async function run(...args: string[]) {
  await ensureTmp();
  const proc = Bun.spawn([BINARY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: TMP,
  });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { exitCode, stdout, stderr };
}

afterEach(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

beforeAll(async () => {
  // Build the standalone binary once for all tests in this file
  const build = Bun.spawn(["bun", "run", "compile"], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: path.resolve("."),
  });
  const exitCode = await build.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(build.stderr).text();
    throw new Error(`bun compile failed:\n${stderr}`);
  }
  await ensureTmp();
});

describe("standalone binary: help", () => {
  test("--help exits 0 and prints usage", async () => {
    const { exitCode, stdout } = await run("--help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("upload-cli");
  });

  test("convert --help exits 0 and lists flags", async () => {
    const { exitCode, stdout } = await run("convert", "--help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("--to");
  });
});

describe("standalone binary: convert", () => {
  test("converts PNG to WebP and writes output file", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode, stdout } = await run("convert", input, "--to", "webp");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Saved to");

    const outputPath = path.join(TMP, "sample.webp");
    expect(await Bun.file(outputPath).exists()).toBe(true);

    const buf = Buffer.from(await Bun.file(outputPath).arrayBuffer());
    expect(buf.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buf.toString("ascii", 8, 12)).toBe("WEBP");
  });

  test("converts PNG to JPEG with resize", async () => {
    const input = await copyFixture("landscape.png");
    const { exitCode, stdout } = await run("convert", input, "--to", "jpeg", "--width", "50", "--force");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("50x25");
  });

  test("errors on unsupported format", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode, stderr } = await run("convert", input, "--to", "bmp");

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unsupported output format");
  });
});
