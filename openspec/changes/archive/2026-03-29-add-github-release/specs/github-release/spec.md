## ADDED Requirements

### Requirement: GitHub Release created on version tag
The system SHALL provide a GitHub Actions workflow at `.github/workflows/release.yml` that creates a GitHub Release when a `v*` tag is pushed.

#### Scenario: Tag push creates release
- **WHEN** a git tag matching `v*` is pushed (e.g., `v0.1.0`)
- **THEN** a GitHub Release SHALL be created with the tag name as the release title

#### Scenario: Non-tag push does not trigger
- **WHEN** a regular commit is pushed to any branch
- **THEN** the release workflow SHALL NOT run

### Requirement: Auto-generated release notes
The release SHALL use GitHub's auto-generated release notes based on merged PRs since the previous release.

#### Scenario: Release notes generated from PRs
- **WHEN** a release is created for tag `v0.2.0`
- **THEN** the release body SHALL contain auto-generated notes summarizing PRs merged since `v0.1.0`

### Requirement: Source archives included automatically
GitHub SHALL automatically attach source code archives (zip and tarball) to the release. No custom build artifacts are needed.

#### Scenario: Source archives attached
- **WHEN** a release is created
- **THEN** the release SHALL include `Source code (zip)` and `Source code (tar.gz)` download links

### Requirement: Authentication via GITHUB_TOKEN
The workflow SHALL use the built-in `GITHUB_TOKEN` to create releases. No additional secrets SHALL be required.

#### Scenario: Auth with default token
- **WHEN** the workflow runs
- **THEN** it SHALL use `secrets.GITHUB_TOKEN` with `contents: write` permission to create the release
