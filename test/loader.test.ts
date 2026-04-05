import { test, expect, describe } from "bun:test";
import path from "path";
import { loadImage } from "../src/loader";

const FIXTURES = path.resolve("test/fixtures");

function makeResponse(body: ArrayBuffer, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

const TINY_IMAGE = new Uint8Array([1, 2, 3, 4]).buffer;

describe("loadImage — remote (injected fetcher)", () => {
  test("calls the injected fetcher when given a URL", async () => {
    let calledWith: string | undefined;
    const fakeFetch = async (url: string) => {
      calledWith = url;
      return makeResponse(TINY_IMAGE);
    };

    await loadImage("https://example.com/photo.png", fakeFetch);

    expect(calledWith).toBe("https://example.com/photo.png");
  });

  test("returns kind=remote with buffer and basename extracted from URL path", async () => {
    const fakeFetch = async (_url: string) => makeResponse(TINY_IMAGE);

    const result = await loadImage("https://example.com/photos/sunset.png", fakeFetch);

    expect(result.kind).toBe("remote");
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBe(TINY_IMAGE.byteLength);
    expect(result.basename).toBe("sunset");
  });

  test("throws 'Failed to download' when fetcher throws a network error", async () => {
    const fakeFetch = async (_url: string): Promise<Response> => {
      throw new Error("network unavailable");
    };

    await expect(loadImage("https://example.com/photo.png", fakeFetch)).rejects.toThrow(
      "Failed to download image from https://example.com/photo.png"
    );
  });

  test("throws with HTTP status when fetcher returns a non-OK response", async () => {
    const fakeFetch = async (_url: string) => makeResponse(TINY_IMAGE, 403);

    await expect(loadImage("https://example.com/photo.png", fakeFetch)).rejects.toThrow(
      "HTTP 403"
    );
  });

  test("throws size limit error when content-length header exceeds 50MB", async () => {
    const oversize = 51 * 1024 * 1024;
    const fakeFetch = async (_url: string) =>
      makeResponse(TINY_IMAGE, 200, { "content-length": String(oversize) });

    await expect(loadImage("https://example.com/big.jpg", fakeFetch)).rejects.toThrow("50MB");
  });

  test("throws size limit error when response body exceeds 50MB (no content-length)", async () => {
    const oversizeBody = new ArrayBuffer(51 * 1024 * 1024);
    const fakeFetch = async (_url: string) => makeResponse(oversizeBody);

    await expect(loadImage("https://example.com/big.jpg", fakeFetch)).rejects.toThrow("50MB");
  });
});

describe("loadImage — local file", () => {
  test("loads a local PNG file and returns buffer, basename, sourceDir", async () => {
    const input = path.join(FIXTURES, "sample.png");
    const result = await loadImage(input);

    expect(result.kind).toBe("local");
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.basename).toBe("sample");
    if (result.kind === "local") {
      expect(result.sourceDir).toBe(FIXTURES);
    }
  });

  test("throws on non-existent local file", async () => {
    await expect(loadImage("/nonexistent/file.png")).rejects.toThrow("File not found");
  });

  test("throws on unsupported local file extension", async () => {
    const gifPath = path.join(FIXTURES, "fake.gif");
    await Bun.write(gifPath, "fake gif data");
    try {
      await expect(loadImage(gifPath)).rejects.toThrow("Unsupported input format");
    } finally {
      await Bun.file(gifPath).unlink();
    }
  });
});
