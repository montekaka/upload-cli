import { Jimp } from "./jimp";
import { mimeType, type Format } from "./formats";

export type { Format };

export interface ConvertOptions {
  format: Format;
  quality?: number;
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
  const mime = mimeType(options.format) as string | undefined;
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
