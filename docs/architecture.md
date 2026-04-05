# Architecture

## Structure

```
src/
├── index.ts       — CLI entry point, command definitions, input validation, output handling
├── loader.ts      — Unified image loading (local files + remote URLs, with injectable fetch)
├── processor.ts   — Pure image conversion/resize logic
└── jimp.ts        — Jimp singleton (formats: JPEG, PNG, WebP + resize plugin)
```

## Key Interfaces

### loader.ts — unified image loading

- **`LoadResult`** — discriminated union:
  - `{ kind: "local", buffer, basename, sourceDir }` — local file with directory info
  - `{ kind: "remote", buffer, basename }` — remote URL
- **`loadImage(input: string, fetcher?: FetchFn): Promise<LoadResult>`** — detects local vs remote, validates, and returns buffer + metadata. `fetcher` defaults to global `fetch`; inject a fake in tests to avoid real network calls.
  - Internally handles URL detection, download, 50MB size guard, HTTP error normalisation, and basename extraction — all hidden from callers.

### processor.ts — the core module

- **`Format`** = `"png" | "jpeg" | "webp"`
- **`Fit`** = `"contain" | "cover" | "fill"`
- **`ConvertOptions`** — `{ format, quality?, width?, height?, fit? }`
- **`ConvertResult`** — `{ buffer, width, height }`
- **`convert(input: Buffer, options: ConvertOptions): Promise<ConvertResult>`** — the main processing function

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

The architecture cleanly separates concerns: `index.ts` handles CLI/IO, `loader.ts` unifies image loading from any source behind a single function (hiding URL detection, download, and validation internally), and `processor.ts` is a pure buffer-in/buffer-out converter.
