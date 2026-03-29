## Context

The `docker-build.yml` workflow already triggers on `v*` tags to build and push Docker images. Now we need a release workflow on the same trigger.

## Goals / Non-Goals

**Goals:**
- Create a GitHub Release with auto-generated notes on each version tag

**Non-Goals:**
- Custom build artifacts (GitHub auto-attaches source zip/tarball)
- Changelog file generation
- Pre-release or draft release handling

## Decisions

### Separate workflow vs. job in docker-build.yml
Use a **separate workflow** (`release.yml`). The release creation is independent of the Docker build -- if one fails, the other should still succeed. Separate workflows are easier to re-run independently.

### Release notes: auto-generated
Use `gh release create` with `--generate-notes` flag, or equivalently `softprops/action-gh-release@v2` with `generate_release_notes: true`. GitHub generates notes from merged PRs since the last release.

**Decision:** Use `softprops/action-gh-release@v2` -- it's the most widely used release action, handles edge cases well, and supports `generate_release_notes`.

### Coordinate with docker-ci
The `docker-ci` spec lists the release workflow as a modification, but since the workflows are independent (separate files, same trigger), the docker-ci spec only needs awareness that both run on the same tag event. No code changes to `docker-build.yml` are needed.

## Risks / Trade-offs

- **First release has empty notes** → Auto-generated notes use PRs since last tag. First tag `v0.1.0` may have minimal notes. Acceptable for initial release.
