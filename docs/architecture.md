# Architecture

## Structure

```
src/
├── index.ts        — CLI entry point, command definitions, input validation, output handling
├── formats.ts      — Format registry: Format type, FORMATS/INPUT_EXTENSIONS constants, parseFormat/isSupportedExtension/mimeType helpers
├── loader.ts       — Unified image loading (local files + remote URLs, with injectable fetch)
├── processor.ts    — Pure image conversion/resize logic (buffer in, buffer out)
├── output-path.ts  — Output file path resolution (--output flag, remote vs local defaults)
└── jimp.ts         — Jimp singleton + custom WebP plugin backed by @jsquash/webp WASM
```

## Key Interfaces

### formats.ts — format registry

- **`Format`** = `"png" | "jpeg" | "webp"`
- **`FORMATS`** — read-only array of all canonical format names (no `"jpg"` alias)
- **`INPUT_EXTENSIONS`** — read-only array of all accepted input extensions (`"png" | "jpeg" | "jpg" | "webp"`)
- **`parseFormat(raw: string): Format | null`** — normalises `"jpg"` → `"jpeg"`, returns `null` for unsupported values. Case-sensitive.
- **`isSupportedExtension(ext: string): boolean`** — checks against `INPUT_EXTENSIONS` (includes `"jpg"` alias)
- **`mimeType(format: Format): string`** — maps format to MIME type (`"image/png"`, `"image/jpeg"`, `"image/webp"`)

### loader.ts — unified image loading

- **`LoadResult`** — discriminated union:
  - `{ kind: "local", buffer, basename, sourceDir }` — local file with directory info
  - `{ kind: "remote", buffer, basename }` — remote URL
- **`loadImage(input: string, fetcher?: FetchFn): Promise<LoadResult>`** — detects local vs remote, validates, and returns buffer + metadata. `fetcher` defaults to global `fetch`; inject a fake in tests to avoid real network calls.
  - Internally handles URL detection, download, 50MB size guard, HTTP error normalisation, and basename extraction — all hidden from callers.

### processor.ts — the core module

- **`Format`** — re-exported from `formats.ts`
- **`Fit`** = `"contain" | "cover" | "fill"`
- **`ConvertOptions`** — `{ format, quality?, width?, height?, fit? }`
- **`ConvertResult`** — `{ buffer, width, height }`
- **`convert(input: Buffer, options: ConvertOptions): Promise<ConvertResult>`** — the main processing function. Validates dimensions (rejects zero or negative values), applies resize, encodes to the target format. Quality is ignored for PNG (lossless).

### output-path.ts — output path resolution

- **`resolveOutputPath(image: LoadResult, format: Format, options?: { output?: string; cwd?: string }): string`** — determines where to write the output file:
  - `--output` provided → resolves it relative to `cwd` (or `process.cwd()`)
  - local image, no `--output` → writes next to the source file with a new extension
  - remote image, no `--output` → writes into `cwd` using the URL's basename

### jimp.ts

Exports a configured `Jimp` class (JPEG, PNG formats + resize plugin) and a custom WebP plugin backed by `@jsquash/webp`. WebP WASM binaries are embedded at compile time via Bun's `with { type: "file" }` import assertions and pre-initialised once via `initWebP()` — this bypasses Emscripten's `locateFile` path resolution which fails inside a standalone binary. `initWebP()` is called eagerly at CLI startup (in `index.ts`) rather than lazily on first use, so WASM is always ready before any image is processed.

## CLI Command

Single subcommand: `upload-cli convert <input> --to <format>` with optional flags: `--quality`, `--width`, `--height`, `--fit`, `--output`, `--force`.

## Data Flow

```
CLI input → validate args (format, quality, dimensions, fit)
  → loadImage()  → local file read  OR  remote download + 50MB guard
  → convert(buffer, options) → validate dimensions → resize if needed → encode to target format
  → resolveOutputPath() → check for existing file (--force to overwrite)
  → write output file → print success message
```

The architecture cleanly separates concerns: `index.ts` handles CLI/IO and arg validation, `loader.ts` unifies image loading from any source behind a single function, `processor.ts` is a pure buffer-in/buffer-out converter, and `output-path.ts` isolates the output path logic behind a single deterministic function.
