# Testing

## Structure

```
test/
├── processor.test.ts   — Unit tests for convert() function (19 tests)
├── loader.test.ts      — Boundary tests for loadImage() — local and remote (9 tests)
├── cli.test.ts         — Integration tests via CLI subprocess (18 tests)
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

## Test Categories

- Format conversion (all 6 pairwise combinations)
- Resize (width-only, height-only, both + all 3 fit modes)
- Quality (JPEG, WebP affected; PNG ignored; default 80)
- Error handling (bad format, missing file, invalid dimensions, invalid fit)
- Output path (`--output` flag, file conflict, `--force`)
- Remote URLs (success, 50MB limit, network failure, `--output` with remote)
