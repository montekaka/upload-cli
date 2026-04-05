#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import pc from "picocolors";
import path from "path";
import { convert, type Format, type Fit } from "./processor";

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
    width: {
      type: "string",
      description: "Resize width in pixels",
    },
    height: {
      type: "string",
      description: "Resize height in pixels",
    },
    fit: {
      type: "string",
      description: "Fit mode when both width and height are given (contain, cover, fill; default: contain)",
    },
    output: {
      type: "string",
      description: "Output file path (default: same directory as input with new extension)",
    },
    force: {
      type: "boolean",
      description: "Overwrite output file if it already exists",
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

    // Parse width/height
    let width: number | undefined;
    if (args.width !== undefined) {
      width = parseInt(args.width, 10);
      if (isNaN(width) || width < 1) {
        console.error(pc.red(`Error: Width must be a positive integer`));
        process.exit(1);
      }
    }

    let height: number | undefined;
    if (args.height !== undefined) {
      height = parseInt(args.height, 10);
      if (isNaN(height) || height < 1) {
        console.error(pc.red(`Error: Height must be a positive integer`));
        process.exit(1);
      }
    }

    // Parse fit
    let fit: Fit | undefined;
    if (args.fit !== undefined) {
      const fitValue = args.fit.toLowerCase();
      if (!["contain", "cover", "fill"].includes(fitValue)) {
        console.error(pc.red(`Error: Unsupported fit mode "${args.fit}". Supported: contain, cover, fill`));
        process.exit(1);
      }
      fit = fitValue as Fit;
    }

    try {
      const inputBuffer = Buffer.from(await inputFile.arrayBuffer());
      const format = normalizeFormat(toFormat);

      const result = await convert(inputBuffer, { format, quality, width, height, fit });

      // Output path: use --output if provided, otherwise same directory with new extension
      let outputPath: string;
      if (args.output) {
        outputPath = path.resolve(args.output);
      } else {
        const outExt = format === "jpeg" ? "jpg" : format;
        outputPath = path.join(
          path.dirname(inputPath),
          `${path.basename(inputPath, path.extname(inputPath))}.${outExt}`
        );
      }

      // Check if output file already exists
      if (!args.force && await Bun.file(outputPath).exists()) {
        console.error(pc.red(`Error: Output file already exists: ${outputPath}. Use --force to overwrite.`));
        process.exit(1);
      }

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
