# Repository settings

Settings applied to this repo on GitHub directly (branch protection, visibility,
collaborators, etc.) rather than through code. Nothing here is enforced by a
file in the repo, so these changes never show up in `git log` — this doc is
the only record of what's been configured and why.

## Branch protection — `main`

Applied 2026-07-25 via the GitHub API:

- **Block force pushes** — history on `main` can't be rewritten.
- **Block deletion** — `main` can't be deleted.
- **Require the `ci` status check to pass** before a pull request can merge.

Deliberately **not** enabled: "require a pull request before merging." Repo
access is solo (only collaborator is the owner), so requiring PRs would only
block direct hotfix pushes with no security benefit — required status checks
only gate the PR merge button, not direct pushes, so this setup still lets
CI catch problems without adding friction to solo pushes.

## Repo visibility

Public. Anyone can view/fork/clone and open a pull request, but only
collaborators with write access can push directly or merge — currently just
the owner. No pending collaborator invitations.
