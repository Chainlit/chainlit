# Release Engineering Instructions

This document outlines the steps for maintainers to create a new release of the project.

## Prerequisites

- You must have maintainer permissions on the repo to create a new release.

## Steps

1. **Determine the new version number**:

   - We use semantic versioning (major.minor.patch).
   - Increment the major version for breaking changes, minor version for new features, patch version for bug fixes only.
   - If unsure, discuss with the maintainers to determine if it should be a major/minor version bump or new patch version.

2. **Bump the package version**:

   - Update `version` in `[tool.poetry]` of `backend/pyproject.toml`.

3. **Update the changelog**:

   - Create a pull request to update the CHANGELOG.md file with the changes for the new release.
   - Mark any breaking changes clearly.
   - Get the changelog update PR reviewed and merged.

4. **Create a new release**:

   - In the GitHub repo, go to the "Releases" page and click "Draft a new release".
   - Input the new version number as the tag (e.g. 4.0.4).
   - Use the "Generate release notes" button to auto-populate the release notes from the changelog.
   - Review the release notes, make any needed edits for clarity.
   - If this is a full release after an RC, remove any "-rc" suffix from the version number.
   - Publish the release.

5. **Update any associated documentation and examples**:
   - If needed, create PRs to update the version referenced in the docs and example code to match the newly released version.
   - Especially important for documented breaking changes.

## RC (Release Candidate) Releases

- We create RC releases to allow testing before a full stable release
- Append "-rc" to the version number (e.g. 4.0.4-rc)
- Normally only bug fixes, no new features, between an RC and the final release version

Ping @dokterbob or @willydouhard for any questions or issues with the release process. Happy releasing!
