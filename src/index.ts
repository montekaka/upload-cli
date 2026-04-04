#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import pc from "picocolors";
import path from "path";
import { convert, type Format } from "./processor";

const SUPPORTED_FORMATS = ["png", "jpeg", "jpg", "webp"];

function normalizeFormat(fmt: string): Format {
  if (fmt === "jpg") return "jpeg";
  return fmt as Format;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${Math.round(bytes / 1024)}KB`;
}

const convertCommand = defineCommand({
  meta: {
    name: "convert",
    description: "Convert an image between formats (PNG, JPEG, WebP)",
  },
  args: {
    input: {
      type: "positional",
      description: "Path to the input image",
      required: true,
    },
    to: {
      type: "string",
      description: "Output format (png, jpeg, webp)",
      required: true,
    },
    quality: {
      type: "string",
      description: "Output quality for JPEG/WebP (1-100, default: 80)",
    },
  },
  async run({ args }) {
    const inputPath = path.resolve(args.input);
    const toFormat = args.to.toLowerCase();

    // Validate output format
    if (!["png", "jpeg", "jpg", "webp"].includes(toFormat)) {
      console.error(pc.red(`Error: Unsupported output format "${args.to}". Supported: png, jpeg, webp`));
      process.exit(1);
    }

    // Validate input file exists
    const inputFile = Bun.file(inputPath);
    if (!(await inputFile.exists())) {
      console.error(pc.red(`Error: File not found: ${inputPath}`));
      process.exit(1);
    }

    // Validate input format
    const inputExt = path.extname(inputPath).slice(1).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(inputExt)) {
      console.error(pc.red(`Error: Unsupported input format "${inputExt}". Supported: png, jpeg, jpg, webp`));
      process.exit(1);
    }

    // Parse quality
    let quality: number | undefined;
    if (args.quality !== undefined) {
      quality = parseInt(args.quality, 10);
      if (isNaN(quality) || quality < 1 || quality > 100) {
        console.error(pc.red(`Error: Quality must be between 1 and 100`));
        process.exit(1);
      }
    }

    try {
      const inputBuffer = Buffer.from(await inputFile.arrayBuffer());
      const format = normalizeFormat(toFormat);

      const result = await convert(inputBuffer, { format, quality });

      // Output path: same directory, new extension
      const outExt = format === "jpeg" ? "jpg" : format;
      const outputPath = path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, path.extname(inputPath))}.${outExt}`
      );

      await Bun.write(outputPath, result.buffer);

      const size = formatSize(result.buffer.length);
      const msg = pc.green(`✓ Saved to ${outputPath} (${result.width}x${result.height}, ${size})\n`);
      await Bun.write(Bun.stdout, msg);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await Bun.write(Bun.stderr, pc.red(`Error: ${message}\n`));
      process.exit(1);
    }
  },
});

const main = defineCommand({
  meta: {
    name: "upload-cli",
    version: "0.1.0",
    description: "Fast CLI tool for image format conversion",
  },
  subCommands: {
    convert: convertCommand,
  },
});

await runMain(main);
