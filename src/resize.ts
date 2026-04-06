import type { ConvertOptions } from "./processor";

export function calculateResizeDimensions(
  imageWidth: number,
  imageHeight: number,
  options: Pick<ConvertOptions, "width" | "height" | "fit">
): { w: number; h: number } {
  if (options.width && !options.height) {
    const ratio = options.width / imageWidth;
    return { w: options.width, h: Math.round(imageHeight * ratio) };
  }

  if (options.height && !options.width) {
    const ratio = options.height / imageHeight;
    return { w: Math.round(imageWidth * ratio), h: options.height };
  }

  if (options.width && options.height) {
    const fit = options.fit ?? "contain";
    if (fit === "contain") {
      const ratio = Math.min(options.width / imageWidth, options.height / imageHeight);
      return { w: Math.round(imageWidth * ratio), h: Math.round(imageHeight * ratio) };
    }
    if (fit === "cover") {
      const ratio = Math.max(options.width / imageWidth, options.height / imageHeight);
      return { w: Math.round(imageWidth * ratio), h: Math.round(imageHeight * ratio) };
    }
    if (fit === "fill") {
      return { w: options.width, h: options.height };
    }
  }

  return { w: imageWidth, h: imageHeight };
}
