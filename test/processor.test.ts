import { test, expect, describe } from "bun:test";
import { convert, type Format } from "../src/processor";

const FIXTURES = "test/fixtures";

async function readFixture(name: string): Promise<Buffer> {
  return Buffer.from(await Bun.file(`${FIXTURES}/${name}`).arrayBuffer());
}

// Magic byte checks for each format
function expectPng(buf: Buffer) {
  expect(buf[0]).toBe(0x89);
  expect(buf.toString("ascii", 1, 4)).toBe("PNG");
}

function expectJpeg(buf: Buffer) {
  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
}

function expectWebp(buf: Buffer) {
  expect(buf.toString("ascii", 0, 4)).toBe("RIFF");
  expect(buf.toString("ascii", 8, 12)).toBe("WEBP");
}

async function readLandscape(): Promise<Buffer> {
  return readFixture("landscape.png"); // 100x50
}

describe("resize", () => {
  test("resizes to specified width, auto-calculating height to preserve aspect ratio", async () => {
    const result = await convert(await readLandscape(), {
      format: "png",
      width: 50,
    });
    expect(result.width).toBe(50);
    expect(result.height).toBe(25);
  });
  test("fit contain (default): fits within bounds preserving aspect ratio", async () => {
    // 100x50 into 40x40 box → 40x20 (width is limiting)
    const result = await convert(await readLandscape(), {
      format: "png",
      width: 40,
      height: 40,
    });
    expect(result.width).toBe(40);
    expect(result.height).toBe(20);
  });

  test("fit cover: fills bounds preserving aspect ratio", async () => {
    // 100x50 into 40x40 box → 80x40 (height is limiting, scales up to fill)
    const result = await convert(await readLandscape(), {
      format: "png",
      width: 40,
      height: 40,
      fit: "cover",
    });
    expect(result.width).toBe(80);
    expect(result.height).toBe(40);
  });

  test("fit fill: stretches to exact dimensions", async () => {
    // 100x50 into 40x40 → exactly 40x40 (stretched)
    const result = await convert(await readLandscape(), {
      format: "png",
      width: 40,
      height: 40,
      fit: "fill",
    });
    expect(result.width).toBe(40);
    expect(result.height).toBe(40);
  });

  test("converts format and resizes in a single operation", async () => {
    const result = await convert(await readLandscape(), {
      format: "webp",
      width: 50,
    });
    expect(result.width).toBe(50);
    expect(result.height).toBe(25);
    expectWebp(result.buffer);
  });

  test("resizes to specified height, auto-calculating width to preserve aspect ratio", async () => {
    const result = await convert(await readLandscape(), {
      format: "png",
      height: 25,
    });
    expect(result.width).toBe(50);
    expect(result.height).toBe(25);
  });
});

describe("convert", () => {
  test("converts PNG to WebP", async () => {
    const result = await convert(await readFixture("sample.png"), { format: "webp" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectWebp(result.buffer);
  });

  test("converts PNG to JPEG", async () => {
    const result = await convert(await readFixture("sample.png"), { format: "jpeg" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectJpeg(result.buffer);
  });

  test("converts JPEG to PNG", async () => {
    const result = await convert(await readFixture("sample.jpg"), { format: "png" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectPng(result.buffer);
  });

  test("converts JPEG to WebP", async () => {
    const result = await convert(await readFixture("sample.jpg"), { format: "webp" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectWebp(result.buffer);
  });

  test("converts WebP to PNG", async () => {
    const result = await convert(await readFixture("sample.webp"), { format: "png" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectPng(result.buffer);
  });

  test("converts WebP to JPEG", async () => {
    const result = await convert(await readFixture("sample.webp"), { format: "jpeg" });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expectJpeg(result.buffer);
  });

  test("quality flag affects JPEG output size", async () => {
    const input = await readFixture("sample.png");
    const lowQ = await convert(input, { format: "jpeg", quality: 1 });
    const highQ = await convert(input, { format: "jpeg", quality: 100 });
    // Low quality should produce smaller (or equal) output than high quality
    expect(lowQ.buffer.length).toBeLessThanOrEqual(highQ.buffer.length);
  });

  test("quality flag affects WebP output size", async () => {
    const input = await readFixture("sample.png");
    const lowQ = await convert(input, { format: "webp", quality: 1 });
    const highQ = await convert(input, { format: "webp", quality: 100 });
    expect(lowQ.buffer.length).toBeLessThanOrEqual(highQ.buffer.length);
  });

  test("quality flag is ignored for PNG output", async () => {
    const input = await readFixture("sample.jpg");
    const q1 = await convert(input, { format: "png", quality: 1 });
    const q100 = await convert(input, { format: "png", quality: 100 });
    // PNG is lossless — quality should have no effect
    expect(q1.buffer.length).toBe(q100.buffer.length);
  });

  test("defaults to quality 80 when not specified", async () => {
    const input = await readFixture("sample.png");
    const defaultQ = await convert(input, { format: "jpeg" });
    const explicit80 = await convert(input, { format: "jpeg", quality: 80 });
    expect(defaultQ.buffer.length).toBe(explicit80.buffer.length);
  });

  test("rejects unsupported output format", async () => {
    const input = await readFixture("sample.png");
    await expect(
      convert(input, { format: "bmp" as unknown as Format })
    ).rejects.toThrow("Unsupported output format: bmp");
  });

  test("rejects invalid image input", async () => {
    const garbage = Buffer.from("not an image");
    await expect(
      convert(garbage, { format: "png" })
    ).rejects.toThrow();
  });
});
