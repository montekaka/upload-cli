import { test, expect, describe, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";

const CLI = path.resolve("src/index.ts");
const FIXTURES = path.resolve("test/fixtures");
const TMP = path.resolve("test/tmp");

async function ensureTmp() {
  await fs.mkdir(TMP, { recursive: true });
}

async function cleanTmp() {
  await fs.rm(TMP, { recursive: true, force: true });
}

async function copyFixture(name: string): Promise<string> {
  await ensureTmp();
  const src = path.join(FIXTURES, name);
  const dest = path.join(TMP, name);
  await fs.copyFile(src, dest);
  return dest;
}

async function run(...args: string[]) {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd: TMP,
  });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { exitCode, stdout, stderr };
}

afterEach(cleanTmp);

describe("CLI convert", () => {
  test("converts PNG to WebP and creates output file", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode } = await run("convert", input, "--to", "webp");

    expect(exitCode).toBe(0);

    const outputPath = path.join(TMP, "sample.webp");
    expect(await Bun.file(outputPath).exists()).toBe(true);

    // Verify it's actually WebP
    const buf = Buffer.from(await Bun.file(outputPath).arrayBuffer());
    expect(buf.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buf.toString("ascii", 8, 12)).toBe("WEBP");
  });

  test("converts PNG to JPEG and prints success message", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode, stdout } = await run("convert", input, "--to", "jpeg");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Saved to");
    expect(stdout).toContain("sample.jpg");
    expect(stdout).toContain("4x4");

    const outputPath = path.join(TMP, "sample.jpg");
    expect(await Bun.file(outputPath).exists()).toBe(true);
  });

  test("converts JPEG to PNG with quality flag ignored", async () => {
    const input = await copyFixture("sample.jpg");
    const { exitCode, stdout } = await run("convert", input, "--to", "png", "--quality", "50");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Saved to");
    expect(stdout).toContain("sample.png");
  });

  test("supports --quality flag for WebP output", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode } = await run("convert", input, "--to", "webp", "--quality", "50");

    expect(exitCode).toBe(0);

    const outputPath = path.join(TMP, "sample.webp");
    expect(await Bun.file(outputPath).exists()).toBe(true);
  });

  test("errors on unsupported output format", async () => {
    const input = await copyFixture("sample.png");
    const { exitCode, stderr } = await run("convert", input, "--to", "bmp");

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unsupported output format");
  });

  test("errors on non-existent input file", async () => {
    await ensureTmp();
    const { exitCode, stderr } = await run("convert", "/nonexistent/file.png", "--to", "webp");

    expect(exitCode).toBe(1);
    expect(stderr).toContain("File not found");
  });

  test("errors on unsupported input format", async () => {
    await ensureTmp();
    const gifPath = path.join(TMP, "fake.gif");
    await Bun.write(gifPath, "fake gif data");

    const { exitCode, stderr } = await run("convert", gifPath, "--to", "png");

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unsupported input format");
  });
});
