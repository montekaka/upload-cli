import { describe, test, expect } from "bun:test";
import {
  parseFormat,
  isSupportedExtension,
  mimeType,
  FORMATS,
  INPUT_EXTENSIONS,
} from "../src/formats";

describe("parseFormat", () => {
  test('normalizes "jpg" to "jpeg"', () => {
    expect(parseFormat("jpg")).toBe("jpeg");
  });

  test('accepts "jpeg" as canonical', () => {
    expect(parseFormat("jpeg")).toBe("jpeg");
  });

  test('returns null for uppercase "PNG" (case-sensitive)', () => {
    expect(parseFormat("PNG")).toBeNull();
  });

  test('returns null for unsupported format "bmp"', () => {
    expect(parseFormat("bmp")).toBeNull();
  });

  test('accepts "png"', () => {
    expect(parseFormat("png")).toBe("png");
  });

  test('accepts "webp"', () => {
    expect(parseFormat("webp")).toBe("webp");
  });
});

describe("isSupportedExtension", () => {
  test('"jpg" is a supported extension', () => {
    expect(isSupportedExtension("jpg")).toBe(true);
  });

  test('"jpeg" is a supported extension', () => {
    expect(isSupportedExtension("jpeg")).toBe(true);
  });

  test('"png" is a supported extension', () => {
    expect(isSupportedExtension("png")).toBe(true);
  });

  test('"webp" is a supported extension', () => {
    expect(isSupportedExtension("webp")).toBe(true);
  });

  test('"bmp" is not a supported extension', () => {
    expect(isSupportedExtension("bmp")).toBe(false);
  });

  test('"gif" is not a supported extension', () => {
    expect(isSupportedExtension("gif")).toBe(false);
  });
});

describe("mimeType", () => {
  test('"webp" resolves to "image/webp"', () => {
    expect(mimeType("webp")).toBe("image/webp");
  });

  test('"png" resolves to "image/png"', () => {
    expect(mimeType("png")).toBe("image/png");
  });

  test('"jpeg" resolves to "image/jpeg"', () => {
    expect(mimeType("jpeg")).toBe("image/jpeg");
  });
});

describe("FORMATS", () => {
  test("contains only canonical names — no aliases", () => {
    expect(FORMATS).toContain("png");
    expect(FORMATS).toContain("jpeg");
    expect(FORMATS).toContain("webp");
    expect(FORMATS).not.toContain("jpg");
  });

  test("has exactly 3 entries", () => {
    expect(FORMATS).toHaveLength(3);
  });
});

describe("INPUT_EXTENSIONS", () => {
  test('contains both "jpg" alias and "jpeg" canonical', () => {
    expect(INPUT_EXTENSIONS).toContain("jpg");
    expect(INPUT_EXTENSIONS).toContain("jpeg");
  });

  test("contains all canonical formats", () => {
    expect(INPUT_EXTENSIONS).toContain("png");
    expect(INPUT_EXTENSIONS).toContain("webp");
  });
});
