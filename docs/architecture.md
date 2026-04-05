# Architecture

## Structure

```
src/
├── index.ts       — CLI entry point, command definitions, input validation, output handling
├── loader.ts      — Unified image loading (local files + remote URLs)
├── processor.ts   — Pure image conversion/resize logic
├── url.ts         — URL detection and remote image downloading (internal to loader)
└── jimp.ts        — Jimp singleton (formats: JPEG, PNG, WebP + resize plugin)
```

## Key Interfaces

### loader.ts — unified image loading

- **`LoadResult`** — discriminated union:
  - `{ kind: "local", buffer, basename, sourceDir }` — local file with directory info
  - `{ kind: "remote", buffer, basename }` — remote URL
- **`loadImage(input: string): Promise<LoadResult>`** — detects local vs remote, validates, and returns buffer + metadata

### processor.ts — the core module

- **`Format`** = `"png" | "jpeg" | "webp"`
- **`Fit`** = `"contain" | "cover" | "fill"`
- **`ConvertOptions`** — `{ format, quality?, width?, height?, fit? }`
- **`ConvertResult`** — `{ buffer, width, height }`
- **`convert(input: Buffer, options: ConvertOptions): Promise<ConvertResult>`** — the main processing function

### url.ts — internal utilities (used by loader.ts)

- **`isUrl(input: string): boolean`** — checks for `http://` or `https://` prefix
- **`deriveFilenameFromUrl(url, format): string`** — extracts filename, swaps extension
- **`downloadImage(url): Promise<Buffer>`** — fetches with 50MB cap

### jimp.ts

Exports a configured `Jimp` class (JPEG, PNG, WebP formats + resize)

## CLI Command

Single subcommand: `upload-cli convert <input> --to <format>` with optional flags: `--quality`, `--width`, `--height`, `--fit`, `--output`, `--force`.

## Data Flow

```
CLI input → validate args → load image (local file or remote URL)
  → convert(buffer, options) → resize if needed → encode to target format
  → write output file → print success message
```

The architecture cleanly separates concerns: `index.ts` handles CLI/IO, `loader.ts` unifies image loading from any source behind a single function, `processor.ts` is a pure buffer-in/buffer-out converter, and `url.ts` provides internal network utilities.
