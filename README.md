# upload-cli

CLI for image format conversion and resizing.

## Install

Preferred distribution is a standalone binary from GitHub Releases. These binaries are built with `bun build --compile`, so end users do not need Bun installed.

### macOS and Linux

1. Download the matching release asset for your platform:
   - `upload-cli-vX.Y.Z-macos-arm64.zip`
   - `upload-cli-vX.Y.Z-macos-x64.zip`
   - `upload-cli-vX.Y.Z-linux-arm64.zip`
   - `upload-cli-vX.Y.Z-linux-x64.zip`
2. Unzip it.
3. Move `upload-cli` somewhere on your `PATH`, for example `/usr/local/bin`.

Example:

```bash
unzip upload-cli-v0.1.0-macos-arm64.zip
chmod +x upload-cli
mv upload-cli /usr/local/bin/upload-cli
```

### Windows

1. Download `upload-cli-vX.Y.Z-windows-x64.zip`.
2. Extract `upload-cli.exe`.
3. Put it in a directory on your `PATH`.

## Usage

```bash
# Convert format
upload-cli convert photo.png --to webp

# Resize by width (auto height)
upload-cli convert photo.png --to webp --width 800

# Resize by height (auto width)
upload-cli convert photo.png --to jpeg --height 600

# Both dimensions with fit mode
upload-cli convert photo.png --to webp --width 800 --height 600 --fit contain
upload-cli convert photo.png --to webp --width 800 --height 600 --fit cover
upload-cli convert photo.png --to webp --width 800 --height 600 --fit fill
```

## Local Development

Install dependencies:

```bash
bun install
```

Link the CLI globally:

```bash
bun link
```

Run without linking:

```bash
bun src/index.ts convert photo.png --to webp --width 800
```

Unlink:

```bash
bun unlink
```

Build a local standalone binary:

```bash
bun run build
```

## Release Process

Push a version tag such as `v0.2.0`:

```bash
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions will build and attach release archives for:

- macOS arm64
- macOS x64
- Linux arm64
- Linux x64
- Windows x64
