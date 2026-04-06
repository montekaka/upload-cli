---
name: release-version
description: Release a new version of this CLI. Use when the user wants to cut a release, bump the package version, create a matching git tag, and push the branch and tag so GitHub Actions can publish binaries.
---

# Release Version

This repo uses a tag-driven GitHub Actions release flow. The manual release work is:

1. Update `package.json` version.
2. Commit that change.
3. Create a matching git tag such as `v0.2.0`.
4. Push the branch and the tag.

After the tag is pushed, `.github/workflows/release.yml` builds and publishes the release artifacts.

## Workflow

### 1. Confirm release target

Identify the target version from the user request. Use:

- package version format: `0.2.0`
- git tag format: `v0.2.0`

If the user gives only the tag, derive the package version by removing the leading `v`.

### 2. Check repo state

Before editing anything:

- run `git status --short`
- do not overwrite unrelated user changes
- if the worktree is dirty in a way that conflicts with the release bump, stop and ask

### 3. Update version

Edit only `package.json` for the version bump. In this repo, `package.json` is the single source of truth for the CLI version.

Do not manually edit the CLI version in `src/index.ts` unless the repo changes its versioning approach later.

### 4. Verify before tagging

Unless the user explicitly asks to skip checks, run:

```bash
bun run build
bun run test:binary
bun run lint
```

If a check fails, do not create the tag until the user decides how to proceed.

### 5. Commit the release

Use a direct non-interactive commit command. Preferred message:

```bash
git commit -m "Release v0.2.0"
```

Replace the version to match the actual release.

### 6. Create the matching tag

Tag must match `package.json` version with a leading `v`:

```bash
git tag v0.2.0
```

### 7. Push branch and tag

Push the branch first, then the tag:

```bash
git push origin main
git push origin v0.2.0
```

If the current branch is not `main`, push the current branch name instead of assuming `main`.

### 8. Close the loop

Tell the user that GitHub Actions should now take over and publish the binaries from the tag-triggered release workflow.

## Output Expectations

When using this skill:

- state the target version clearly
- ensure `package.json` and the tag match exactly
- use non-interactive git commands only
- mention when checks were run and whether they passed
- mention that release publishing happens after tag push, not before

## Reference

If you need the full repository runbook, read `docs/releasing.md`.
