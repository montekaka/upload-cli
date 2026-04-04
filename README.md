# upload-cli

Local setup

1. Install dependencies (if you haven't already):
bun install
2. Link the CLI globally:
bun link

2. This registers upload-cli as a global command using the bin entry in package.json.
3. Try it out:
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

3. Or without linking, run directly:
bun src/index.ts convert photo.png --to webp --width 800

Unlink

`bun unlink`