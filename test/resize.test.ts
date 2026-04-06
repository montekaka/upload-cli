import { test, expect, describe } from "bun:test";
import { calculateResizeDimensions } from "../src/resize";

describe("calculateResizeDimensions", () => {
  test("returns original dimensions when no resize options given", () => {
    expect(calculateResizeDimensions(100, 50, {})).toEqual({ w: 100, h: 50 });
  });

  test("width-only: scales height to preserve aspect ratio", () => {
    expect(calculateResizeDimensions(100, 50, { width: 50 })).toEqual({ w: 50, h: 25 });
  });

  test("height-only: scales width to preserve aspect ratio", () => {
    expect(calculateResizeDimensions(100, 50, { height: 25 })).toEqual({ w: 50, h: 25 });
  });

  test("contain (default): fits within bounds preserving aspect ratio", () => {
    // 100x50 into 40x40 box → width is limiting axis → 40x20
    expect(calculateResizeDimensions(100, 50, { width: 40, height: 40 })).toEqual({ w: 40, h: 20 });
  });

  test("contain (explicit): fits within bounds preserving aspect ratio", () => {
    expect(calculateResizeDimensions(100, 50, { width: 40, height: 40, fit: "contain" })).toEqual({ w: 40, h: 20 });
  });

  test("cover: fills bounds preserving aspect ratio using Math.max", () => {
    // 100x50 into 40x40 box → height is constraining → 80x40
    expect(calculateResizeDimensions(100, 50, { width: 40, height: 40, fit: "cover" })).toEqual({ w: 80, h: 40 });
  });

  test("fill: stretches to exact dimensions, no ratio calculation", () => {
    expect(calculateResizeDimensions(100, 50, { width: 40, height: 40, fit: "fill" })).toEqual({ w: 40, h: 40 });
  });

  test("rounding edge case: odd-dimension image produces integer output", () => {
    // 999x333 → width 100: ratio = 100/999 ≈ 0.1001, h = 333 * 0.1001 ≈ 33.33 → 33
    const result = calculateResizeDimensions(999, 333, { width: 100 });
    expect(result.w).toBe(100);
    expect(Number.isInteger(result.h)).toBe(true);
  });
});
