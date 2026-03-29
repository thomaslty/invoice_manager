## 1. GitHub Actions Release Workflow

- [x] 1.1 Create `.github/workflows/release.yml` with `v*` tag trigger
- [x] 1.2 Add `softprops/action-gh-release@v2` step with `generate_release_notes: true`
- [x] 1.3 Set `contents: write` permission and use `GITHUB_TOKEN` for auth
