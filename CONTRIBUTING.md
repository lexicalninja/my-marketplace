# Contributing

This marketplace is a **thin catalog**. Plugins are not developed here — they live in their own product repositories and are referenced from `.claude-plugin/marketplace.json`.

## Add a plugin

1. Ship a valid Claude Code plugin in its own repo (`.claude-plugin/plugin.json`, plus agents/skills/commands as needed).
2. Open a PR against this repo that adds an entry to `.claude-plugin/marketplace.json`.

### Preferred entry shape (GitHub source)

```json
{
  "name": "your-plugin-slug",
  "displayName": "Your Plugin",
  "description": "One or two sentences about what it does.",
  "source": {
    "source": "github",
    "repo": "your-org/your-repo"
  },
  "author": {
    "name": "Your Name"
  },
  "license": "MIT",
  "category": "development",
  "keywords": ["keyword1", "keyword2"],
  "homepage": "https://github.com/your-org/your-repo"
}
```

If the plugin lives in a subdirectory of the source repo, add `"path": "relative/path"`.

### Rules

- **Do not** copy plugin source into this repository.
- **Do not** put VS Code extensions, CLI apps, or other non–Claude-Code surfaces under this repo. Those belong in the product repo (e.g. under `packages/`).
- Plugin `name` values are immutable once published. Use `displayName` for UI labels. If a rename is unavoidable, add an entry to the top-level `renames` map.
- Keep descriptions accurate and concise; link `homepage` to the product repo.

## Validate locally

```bash
claude plugin validate .
```

## Pull requests

PRs should only touch catalog/docs files (`.claude-plugin/marketplace.json`, `README.md`, `CONTRIBUTING.md`, workflows). Include a short note on why the plugin belongs in the catalog.
