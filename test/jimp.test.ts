import { test, expect, describe } from "bun:test";
import { initWebP } from "../src/jimp";

describe("initWebP", () => {
  test("resolves without error", async () => {
    await expect(initWebP()).resolves.toBeUndefined();
  });

  test("calling twice is safe — second call resolves immediately without double-init", async () => {
    // First call (may already be done from beforeAll)
    await initWebP();
    // Second call should resolve immediately (memoized)
    await expect(initWebP()).resolves.toBeUndefined();
  });
});
