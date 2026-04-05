import { describe, test, expect } from "bun:test";
import { parseFormat, mimeType, fileExtension } from "../src/formats";

describe("parseFormat", () => {
  test("recognizes png", () => {
    expect(parseFormat("png")).toBe("png");
  });

  test("recognizes jpeg and webp", () => {
    expect(parseFormat("jpeg")).toBe("jpeg");
    expect(parseFormat("webp")).toBe("webp");
  });

  test("normalizes jpg alias to jpeg", () => {
    expect(parseFormat("jpg")).toBe("jpeg");
  });

  test("returns null for unknown format", () => {
    expect(parseFormat("gif")).toBeNull();
    expect(parseFormat("avif")).toBeNull();
    expect(parseFormat("")).toBeNull();
  });
});

describe("mimeType", () => {
  test("returns correct MIME type for each format", () => {
    expect(mimeType("png")).toBe("image/png");
    expect(mimeType("jpeg")).toBe("image/jpeg");
    expect(mimeType("webp")).toBe("image/webp");
  });
});

describe("fileExtension", () => {
  test("jpeg maps to jpg extension", () => {
    expect(fileExtension("jpeg")).toBe("jpg");
  });

  test("png and webp use their own extension", () => {
    expect(fileExtension("png")).toBe("png");
    expect(fileExtension("webp")).toBe("webp");
  });
});
