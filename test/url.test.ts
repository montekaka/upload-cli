import { describe, test, expect } from "bun:test";
import { isUrl, deriveFilenameFromUrl } from "../src/url";

describe("isUrl", () => {
  test("returns true for https URLs", () => {
    expect(isUrl("https://example.com/photo.png")).toBe(true);
  });

  test("returns true for http URLs", () => {
    expect(isUrl("http://example.com/photo.png")).toBe(true);
  });

  test("returns false for local file paths", () => {
    expect(isUrl("./photo.png")).toBe(false);
    expect(isUrl("/Users/me/photo.png")).toBe(false);
    expect(isUrl("photo.png")).toBe(false);
  });
});

describe("deriveFilenameFromUrl", () => {
  test("extracts filename and replaces extension with target format", () => {
    expect(deriveFilenameFromUrl("https://example.com/photo.png", "webp")).toBe("photo.webp");
  });

  test("handles URLs with path segments", () => {
    expect(deriveFilenameFromUrl("https://s3-media0.fl.yelpcdn.com/bphoto/PHJIpAq5y8CoHr0lg-M0_g/o.jpg", "webp")).toBe("o.webp");
  });

  test("handles URLs with query strings", () => {
    expect(deriveFilenameFromUrl("https://example.com/photo.png?width=100", "jpeg")).toBe("photo.jpg");
  });

  test("maps jpeg format to .jpg extension", () => {
    expect(deriveFilenameFromUrl("https://example.com/photo.png", "jpeg")).toBe("photo.jpg");
  });
});
