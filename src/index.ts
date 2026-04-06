#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import pc from "picocolors";
import { convert, type Fit } from "./processor";
import { loadImage } from "./loader";
import { resolveOutputPath } from "./output-path";
import { parseFormat, FORMATS } from "./formats";
import { initWebP } from "./jimp";

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
    // Validate and normalize output format
    const format = parseFormat(args.to.toLowerCase());
    if (!format) {
      console.error(pc.red(`Error: Unsupported output format "${args.to}". Supported: ${FORMATS.join(", ")}`));
      process.exit(1);
    }

    // Load image (local or remote)
    let image: Awaited<ReturnType<typeof loadImage>>;
    try {
      image = await loadImage(args.input);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await Bun.write(Bun.stderr, pc.red(`Error: ${message}\n`));
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
      const result = await convert(image.buffer, { format, quality, width, height, fit });

      const outputPath = resolveOutputPath(
        image.basename,
        format,
        {
          output: args.output,
          sourceDir: image.kind === "local" ? image.sourceDir : undefined,
        }
      );

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

await initWebP();
await runMain(main);
