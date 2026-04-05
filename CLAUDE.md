# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CLI tool (`upload-cli`) for image format conversion and resizing. Built with TypeScript on the Bun runtime (not Node.js). Uses `citty` for CLI parsing and `jimp` for image processing. Supports PNG, JPEG, and WebP formats.

## Commands

- `bun install` — install dependencies
- `bun run src/index.ts <args>` — run CLI directly
- `bun link` / `bun unlink` — link/unlink CLI globally
- `bun test` — run all tests
- `bun test test/processor.test.ts` — run a single test file
- `bun test -t "resize"` — run tests matching a pattern
- `bun run lint` — run ESLint

No build step needed — Bun handles TypeScript at runtime.

[Architecture](docs/architecture.md)


[Testing](docs/testing.md)

## Conventions

- Use Bun, not Node.js/npm/pnpm/vite.
- Direct module imports (no barrel exports).
- Colored CLI output via `picocolors` — success uses `✓ Saved to ...`, errors are red with exit code 1.

You must create a new feature branch to work on a new github issue.