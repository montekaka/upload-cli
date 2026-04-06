# Releasing

This project is released as standalone binaries built with Bun. End users install the binary from GitHub Releases and do not need Bun installed.

## Release Checklist

1. Make sure your working tree is clean.

```bash
git status --short
```

2. Update the version in `package.json`.

Example:

```json
{
  "version": "0.2.0"
}
```

Notes:

- `package.json` is the single source of truth for the CLI version.
- `upload-cli --version` reads from `package.json`.
- The Git tag must match the package version, with a leading `v`.

3. Run the release verification commands locally.

```bash
bun install
bun run build
bun run test:binary
bun run lint
```

4. Commit the version bump and any release notes or docs updates.

Example:

```bash
git add package.json README.md docs/releasing.md .github/workflows/release.yml
git commit -m "Release v0.2.0"
```

Adjust the file list to match your actual changes.

5. Push the commit to the main branch.

```bash
git push origin main
```

6. Create a version tag that matches `package.json`.

If `package.json` says `0.2.0`, the tag must be `v0.2.0`.

```bash
git tag v0.2.0
```

7. Push the tag.

```bash
git push origin v0.2.0
```

8. Wait for the GitHub Actions release workflow to finish.

The workflow is defined in `.github/workflows/release.yml`. It runs when a tag matching `v*` is pushed.

9. Verify the GitHub Release contains all expected assets.

Expected archives:

- `upload-cli-v0.2.0-macos-arm64.zip`
- `upload-cli-v0.2.0-macos-x64.zip`
- `upload-cli-v0.2.0-linux-arm64.zip`
- `upload-cli-v0.2.0-linux-x64.zip`
- `upload-cli-v0.2.0-windows-x64.zip`

Expected checksum files:

- `upload-cli-v0.2.0-macos-arm64.sha256`
- `upload-cli-v0.2.0-macos-x64.sha256`
- `upload-cli-v0.2.0-linux-arm64.sha256`
- `upload-cli-v0.2.0-linux-x64.sha256`
- `upload-cli-v0.2.0-windows-x64.sha256`

10. Smoke test one downloaded artifact from the release page.

Example on macOS or Linux:

```bash
unzip upload-cli-v0.2.0-macos-arm64.zip
chmod +x upload-cli
./upload-cli --version
./upload-cli --help
```

## What the Release Workflow Does

When you push a tag like `v0.2.0`, GitHub Actions:

1. Installs Bun and project dependencies.
2. Builds standalone executables with `bun build --compile`.
3. Produces binaries for:
   - macOS arm64
   - macOS x64
   - Linux arm64
   - Linux x64
   - Windows x64
4. Packages each binary into a zip archive.
5. Generates a `.sha256` checksum for each archive.
6. Uploads those files to the GitHub Release for that tag.

## Release Commands

For a `0.2.0` release:

```bash
bun run build
bun run test:binary
bun run lint
git add package.json
git commit -m "Release v0.2.0"
git push origin main
git tag v0.2.0
git push origin v0.2.0
```

## Common Mistakes

- Updating the tag but not `package.json`
- Updating `package.json` but pushing a mismatched tag
- Forgetting to push the tag after creating it locally
- Assuming users install with Bun instead of downloading the compiled release asset
