import { test, expect, describe, afterEach } from "bun:test";
import net from "net";
import path from "path";
import { loadImage } from "../src/loader";

const FIXTURES = path.resolve("test/fixtures");

let server: ReturnType<typeof Bun.serve> | null = null;

function startFixtureServer() {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const fixtureName = url.pathname.slice(1);
      const fixturePath = path.join(FIXTURES, fixtureName);
      const file = Bun.file(fixturePath);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },
  });
  return server;
}

afterEach(() => {
  if (server) {
    server.stop();
    server = null;
  }
});

describe("loadImage", () => {
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

  test("loads a remote URL and returns buffer, basename", async () => {
    const srv = startFixtureServer();
    const url = `http://localhost:${srv.port}/sample.png`;

    const result = await loadImage(url);

    expect(result.kind).toBe("remote");
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.basename).toBe("sample");
  });

  test("throws on non-existent local file", async () => {
    expect(loadImage("/nonexistent/file.png")).rejects.toThrow("File not found");
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

  test("throws on remote download failure", async () => {
    const url = "http://localhost:19999/nonexistent.png";
    await expect(loadImage(url)).rejects.toThrow("Failed to download");
  });

  test("throws on remote file exceeding 50MB", async () => {
    const tcpServer = net.createServer((socket) => {
      const size = 51 * 1024 * 1024;
      socket.write(`HTTP/1.1 200 OK\r\nContent-Length: ${size}\r\nConnection: close\r\n\r\n`);
      socket.end("x");
    });
    await new Promise<void>((resolve) => tcpServer.listen(0, resolve));
    const port = (tcpServer.address() as net.AddressInfo).port;

    try {
      await expect(loadImage(`http://localhost:${port}/big.jpg`)).rejects.toThrow("50MB");
    } finally {
      tcpServer.close();
    }
  });
});
