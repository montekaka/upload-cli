## Problem Statement

Users frequently need to convert images between formats (PNG, JPEG, WebP) and resize them for various purposes — web optimization, social media, email, etc. Existing tools either require a GUI (Photoshop, Preview), are overly complex CLI tools with hundreds of options (ImageMagick), or don't support fetching images from URLs. There is no simple, fast CLI tool that handles format conversion, resizing, and remote URL input in one command.

## Solution

`upload-cli` is a fast, minimal CLI tool built with Bun and TypeScript that converts images between PNG, JPEG, and WebP formats, with optional resizing. It accepts both local files and remote URLs as input, and outputs converted files locally. The tool prioritizes simplicity — sensible defaults, clear error messages, and a single `convert` subcommand that handles both conversion and resizing in one call.

## User Stories

1. As a web developer, I want to convert a PNG screenshot to WebP, so that I can reduce file size for my website.
2. As a web developer, I want to convert a PNG to JPEG, so that I can use it in contexts that don't support PNG.
3. As a designer, I want to convert a JPEG to PNG, so that I can preserve quality for further editing.
4. As a web developer, I want to convert a WebP image to PNG, so that I can use it in tools that don't support WebP.
5. As a developer, I want to resize an image by specifying a width, so that it fits a specific layout without manual cropping.
6. As a developer, I want to resize an image by specifying both width and height, so that I get exact dimensions for a specific container.
7. As a developer, I want to control the fit mode (contain, cover, fill) when resizing, so that I can choose how the image is scaled to the target dimensions.
8. As a developer, I want the default fit mode to be "contain", so that my images are never cropped or distorted unexpectedly.
9. As a developer, I want to convert and resize in a single command, so that I don't have to run multiple steps.
10. As a developer, I want to convert an image from a remote URL, so that I don't have to manually download it first.
11. As a developer, I want a 50MB download size cap for remote URLs, so that I don't accidentally download massive files.
12. As a developer, I want to control JPEG and WebP output quality with a `--quality` flag, so that I can balance file size and image quality.
13. As a developer, I want a sensible default quality (80), so that I get good results without needing to specify it every time.
14. As a developer, I want the output file saved in the same directory as the input by default, so that I can find it easily.
15. As a developer, I want to override the output location with `--output`, so that I can save files wherever I need.
16. As a developer, I want the tool to error if the output file already exists, so that I don't accidentally overwrite important files.
17. As a developer, I want a `--force` flag to overwrite existing files, so that I can explicitly opt in to overwriting when I need to.
18. As a developer, I want to see a success message with the output path, dimensions, and file size, so that I can confirm the operation worked.
19. As a developer, I want clear, colored error messages, so that I can quickly understand what went wrong.
20. As a developer, I want the tool to exit with a non-zero exit code on failure, so that I can use it in scripts and CI pipelines.
21. As a developer, I want to install the tool via npm (`npm install -g upload-cli`), so that installation is easy.
22. As a developer, I want a standalone compiled binary option, so that I can use the tool without needing Node or Bun installed.
23. As a developer, I want the PNG quality setting to be ignored (lossless), so that I don't get unexpected lossy PNG output.
24. As a developer, I want clear validation errors for invalid flags (e.g., negative width, unsupported format), so that I know exactly what to fix.
25. As a developer, I want the output filename to be derived from the URL path when converting remote images, so that I get a meaningful filename automatically.

## Implementation Decisions

- **Runtime:** Bun with TypeScript. No build step needed for development. Bun's native TS support and fast startup make it ideal for CLI tools.
- **Image processing library:** `jimp` (pure JavaScript). Chosen over `sharp` because it has no native bindings, enabling clean `bun build --compile` standalone binaries. Performance is sufficient for single-file CLI operations.
- **CLI framework:** `citty` (by UnJS). Lightweight, TypeScript-first, zero dependencies. Handles subcommand routing and argument parsing.
- **Supported formats:** PNG, JPEG, WebP. Any-to-any conversion between these three.
- **Command structure:** Subcommand-based. The `convert` subcommand handles both format conversion and resizing. This leaves room for future subcommands (e.g., `upload`).
  - `upload-cli convert <input> --to <format> [--width N] [--height N] [--fit contain|cover|fill] [--quality N] [--output path] [--force]`
- **Resize behavior:** When only `--width` is provided, height is auto-calculated to preserve aspect ratio (and vice versa). When both are provided, `--fit` controls the behavior (default: contain).
- **Remote URL handling:** Download image to memory buffer, enforce 50MB size cap, then process identically to local files.
- **Output path resolution:** Default to same directory as input file. For remote URLs, derive filename from URL path. `--output` overrides entirely.
- **File conflict handling:** Error and exit if output file exists. `--force` flag to overwrite.
- **Error handling:** All errors exit with code 1. Error messages are colored red using `picocolors`.
- **User feedback:** Minimal output on success: `Saved to ./photo.webp (800x600, 45KB)`.
- **Distribution:** npm registry as primary. `bun build --compile` for standalone binaries (enabled by the choice of `jimp` over `sharp`).

### Module Architecture

- **CLI Entry & Routing (`src/index.ts`):** Defines the main command and `convert` subcommand using `citty`. Parses and validates all flags.
- **Input Resolver (`src/input.ts`):** Determines if input is local file or URL. Downloads remote images with size cap. Validates supported formats.
- **Image Processor (`src/processor.ts`):** Core deep module. Accepts image buffer + options, returns converted buffer. Handles format conversion, resizing, and quality. Interface: `process(buffer, options) -> buffer`.
- **Output Writer (`src/output.ts`):** Resolves output path, checks for conflicts, writes file to disk.
- **Logger (`src/logger.ts`):** Formats success and error messages with `picocolors`.

## Testing Decisions

Good tests for this project should test external behavior through module interfaces, not implementation details. Tests should verify that given a specific input (image buffer + options), the correct output is produced (converted buffer with expected format, dimensions, quality).

### Modules to test:

- **Image Processor (`src/processor.ts`):** Primary test target. Pure function (buffer in, buffer out). Test cases include:
  - Format conversion between all supported format pairs (PNG->JPEG, PNG->WebP, JPEG->PNG, JPEG->WebP, WebP->PNG, WebP->JPEG)
  - Resizing with width only, height only, both with each fit mode
  - Quality settings for JPEG and WebP output
  - Quality flag ignored for PNG output
  - Invalid options handling (negative dimensions, unsupported format)

- **Input Resolver (`src/input.ts`):** Test cases include:
  - Local file path detection vs URL detection
  - File size validation for remote URLs (50MB cap)
  - Unsupported format rejection
  - Filename derivation from URLs

## Out of Scope

- **Upload functionality:** Uploading converted images to cloud services (S3, Cloudinary, etc.) is planned for a future version but not part of v1.
- **Batch processing:** Processing multiple files, glob patterns, or directory recursion.
- **SVG support:** Neither rasterization (SVG input) nor vectorization (SVG output).
- **GIF support:** Animated image handling adds significant complexity.
- **TIFF/AVIF support:** Niche formats deferred for now.
- **Percentage-based resizing:** `--scale 50%` deferred for simplicity.
- **Image optimization without conversion:** e.g., compressing a JPEG without changing format.
- **Interactive prompts:** No interactive confirmation dialogs (e.g., "Overwrite? y/n").
- **Configuration files:** No `.uploadrc` or config file support.
- **Verbose/progress output:** No `--verbose` flag or download progress bars.
- **Authentication for remote URLs:** No Bearer token or signed URL support.

## Further Notes

- The tool name `upload-cli` reflects the long-term vision of the project, which will include upload capabilities in future versions. The `convert` subcommand is the first feature.
- `jimp` was chosen specifically to enable `bun build --compile` for standalone binary distribution. If performance becomes a concern for large images, `sharp` could be reconsidered, but standalone binary support would need to be revisited.
- `citty` is a newer, less widely adopted CLI framework compared to `commander` or `yargs`. If limitations are discovered during implementation, migration to `commander` would be straightforward.
