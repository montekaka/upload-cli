# Testing

## Structure

```
test/
├── processor.test.ts   — Unit tests for convert() function (23 tests)
├── loader.test.ts      — Boundary tests for loadImage() — local and remote (11 tests)
├── output-path.test.ts — Unit tests for resolveOutputPath() (6 tests)
├── cli.test.ts         — Integration tests via CLI subprocess (22 tests)
├── binary.test.ts      — Smoke tests against the compiled standalone binary (6 tests)
├── formats.test.ts     — Unit tests for the format registry (21 tests)
├── jimp.test.ts        — Unit tests for WebP WASM initialisation (2 tests)
├── create-fixtures.ts  — Script to generate test images
└── fixtures/
    ├── sample.png      — 4x4 red image
    ├── sample.jpg      — 4x4 red image
    ├── sample.webp     — 4x4 red image
    └── landscape.png   — 100x50 blue image (for resize tests)
```

## Test Patterns

### Unit tests (`processor.test.ts`)

- Import functions directly and test in-process
- Use magic byte checks (`expectPng`, `expectJpeg`, `expectWebp`) to verify output format
- `readFixture(name)` helper loads fixture files

### Unit tests (`output-path.test.ts`)

- Call `resolveOutputPath()` directly with synthetic `LoadResult` values — no real filesystem access
- Covers: local saves next to source, remote saves in cwd, `--output` override, `.jpg` extension for `jpeg` format

### Boundary tests (`loader.test.ts`)

- Test `loadImage()` through its public interface only — no access to internal helpers
- Remote paths use an injected `FetchFn` (fake fetch) — no real HTTP servers or sockets
- Local paths use real fixture files on disk
- Covers: successful load, basename extraction, network errors, HTTP status errors, 50MB size guard (header and body), missing file, unsupported extension

### Integration tests (`cli.test.ts`)

- Spawn `bun run src/index.ts` as a subprocess via `run(...args)`
- Assert on `exitCode`, `stdout`, `stderr`
- Copy fixtures to `test/tmp/` before each test, clean up after via `afterEach`
- Local HTTP server (`Bun.serve`) for remote URL tests; raw TCP server for 50MB limit test
- Server is stopped in `afterEach`

### Binary smoke tests (`binary.test.ts`)

- Run `dist/upload-cli` (the compiled standalone binary) as a subprocess
- `beforeAll` compiles the binary once via `bun run compile` before any test runs
- Uses a separate `test/tmp-binary/` directory, cleaned up in `afterEach`
- Covers help output, a core conversion, a resize, and an error case — confirms the binary works end-to-end with embedded WASM assets

### Unit tests (`formats.test.ts`)

- Test the format registry functions directly with no I/O or image processing
- Covers `parseFormat` (including `"jpg"` → `"jpeg"` normalisation and case-sensitivity), `isSupportedExtension`, `mimeType`, and the `FORMATS`/`INPUT_EXTENSIONS` constants
- Verifies that `FORMATS` contains only canonical names (no `"jpg"` alias) and exactly 3 entries

### Unit tests (`jimp.test.ts`)

- Verify that `initWebP()` resolves without error
- Verify that calling `initWebP()` a second time is safe (memoized — second call completes immediately without re-initialising WASM)

## Test Categories

- Format conversion (all 6 pairwise combinations: PNG↔JPEG, PNG↔WebP, JPEG↔WebP)
- Resize (width-only, height-only, both + all 3 fit modes)
- Quality (JPEG and WebP affected; PNG ignored; default 80)
- Error handling (bad format, missing file, invalid/negative dimensions, invalid fit)
- Output path (`--output` flag, local vs remote defaults, `.jpg` extension for `jpeg`, file conflict, `--force`)
- Remote URLs (success, 50MB limit via header and body, network failure, `--output` with remote)
- Format registry (`parseFormat` aliasing, `isSupportedExtension`, `mimeType`, constant shape)
- WebP WASM init (`initWebP` success, idempotency)
- Standalone binary (help, convert, resize, error — verifies embedded WASM works outside dev environment)
