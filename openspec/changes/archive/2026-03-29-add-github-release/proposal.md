## Why

Version tags produce Docker images (via the docker-ci workflow) but no corresponding GitHub Release. Adding a release workflow gives each version a visible release page with auto-generated changelog and source archives (zip/tarball are included by GitHub automatically).

## What Changes

- Add a GitHub Actions workflow that creates a GitHub Release when a `v*` tag is pushed
- The release uses GitHub's auto-generated release notes (based on PR titles/labels since last release)
- Source code zip/tarball are attached automatically by GitHub -- no custom build artifacts needed

## Capabilities

### New Capabilities
- `github-release`: GitHub Actions workflow to create a GitHub Release on version tag push

### Modified Capabilities
- `docker-ci`: Add release workflow job or coordinate with existing docker build workflow

## Impact

- **New file**: `.github/workflows/release.yml` (or added to existing `docker-build.yml`)
- **External dependency**: GitHub Releases API via `GITHUB_TOKEN`
