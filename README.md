# my-marketplace

A thin Claude Code plugin marketplace. Product code lives in separate repos; this catalog only lists them.

## Install

```
/plugin marketplace add lexicalninja/my-marketplace
```

Then install plugins:

```
/plugin install mlst@my-marketplace
/plugin install tech-debt-audit@my-marketplace
/plugin install proposal-team@my-marketplace
```

## Plugins

| Plugin | Description | Repo |
|--------|-------------|------|
| [mlst](https://github.com/lexicalninja/my-little-scrum-team) | Coordinated AI scrum team (`/build` + specialist agents) | [my-little-scrum-team](https://github.com/lexicalninja/my-little-scrum-team) |
| [tech-debt-audit](https://github.com/lexicalninja/tech-debt-audit) | Multi-language tech debt / architecture audit | [tech-debt-audit](https://github.com/lexicalninja/tech-debt-audit) |
| [proposal-team](https://github.com/lexicalninja/proposal-team) | Federal proposal writing & review agents | [proposal-team](https://github.com/lexicalninja/proposal-team) |

## Marketplace notes

- Marketplace slug: `my-marketplace` (was previously `proposal-team` in older clones — re-add the marketplace if your install still shows the old name).
- Plugin slug `proposal-team-plugin` was renamed to `proposal-team`; the catalog includes a `renames` entry so existing installs can migrate.

## Validation

```bash
claude plugin validate .
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Prefer GitHub sources — do not vendor product code into this repo.

## License

MIT (see each product repo for its own license details).
