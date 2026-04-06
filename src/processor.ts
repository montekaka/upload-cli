import { Jimp, ensureWebPReady } from "./jimp";
import { mimeType, type Format } from "./formats";

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
  await ensureWebPReady();
  const image = await Jimp.fromBuffer(input);

  if (options.width && !options.height) {
    const ratio = options.width / image.width;
    image.resize({ w: options.width, h: Math.round(image.height * ratio) });
  } else if (options.height && !options.width) {
    const ratio = options.height / image.height;
    image.resize({ w: Math.round(image.width * ratio), h: options.height });
  } else if (options.width && options.height) {
    const fit = options.fit ?? "contain";
    if (fit === "contain") {
      const ratio = Math.min(options.width / image.width, options.height / image.height);
      image.resize({ w: Math.round(image.width * ratio), h: Math.round(image.height * ratio) });
    } else if (fit === "cover") {
      const ratio = Math.max(options.width / image.width, options.height / image.height);
      image.resize({ w: Math.round(image.width * ratio), h: Math.round(image.height * ratio) });
    } else if (fit === "fill") {
      image.resize({ w: options.width, h: options.height });
    }
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
