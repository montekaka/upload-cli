import { Jimp } from "./jimp";

export type Format = "png" | "jpeg" | "webp";

export interface ConvertOptions {
  format: Format;
  quality?: number;
}

export interface ConvertResult {
  buffer: Buffer;
  width: number;
  height: number;
}

const MIME_MAP: Record<Format, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const DEFAULT_QUALITY = 80;

export async function convert(
  input: Buffer,
  options: ConvertOptions
): Promise<ConvertResult> {
  const mime = MIME_MAP[options.format];
  if (!mime) {
    throw new Error(`Unsupported output format: ${options.format}`);
  }
  const image = await Jimp.fromBuffer(input);

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
