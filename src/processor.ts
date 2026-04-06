import { Jimp } from "./jimp";
import { mimeType, type Format } from "./formats";
import { calculateResizeDimensions } from "./resize";

export type { Format } from "./formats";

export type Fit = "contain" | "cover" | "fill";

export interface ConvertOptions {
  format: Format;
  quality?: number;
  width?: number;
  height?: number;
  fit?: Fit;
}

export interface ConvertResult {
  buffer: Buffer;
  width: number;
  height: number;
}

const DEFAULT_QUALITY = 80;

export async function convert(
  input: Buffer,
  options: ConvertOptions
): Promise<ConvertResult> {
  const mime = mimeType(options.format);

  if (options.width !== undefined && options.width <= 0) {
    throw new Error("Invalid dimensions: width must be a positive number");
  }
  if (options.height !== undefined && options.height <= 0) {
    throw new Error("Invalid dimensions: height must be a positive number");
  }
  const image = await Jimp.fromBuffer(input);

  if (options.width !== undefined || options.height !== undefined) {
    image.resize(calculateResizeDimensions(image.width, image.height, options));
  }

  const quality = options.quality ?? DEFAULT_QUALITY;
  const encodeOptions =
    options.format === "png" ? {} : { quality };

  const buffer = await image.getBuffer(mime as "image/png", encodeOptions);

  return {
    buffer: Buffer.from(buffer),
    width: image.width,
    height: image.height,
  };
}
