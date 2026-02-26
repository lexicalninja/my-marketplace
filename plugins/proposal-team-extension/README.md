# Proposal Team — VS Code Chat Extension

Multi-agent federal proposal development system for VS Code Chat. Orchestrates specialized AI agents to analyze solicitations, create outlines, draft sections, and review proposals.

## Features

Use `@proposal-team` in VS Code Chat with these commands:

| Command | Description |
|---------|-------------|
| `/setup` | Initialize project directory structure |
| `/analyze` | Analyze a solicitation — extract requirements, evaluation factors, risks |
| `/outline` | Create a Blue Outline with section-by-section writing instructions |
| `/draft` | Draft one or more proposal sections as proposal-ready prose |
| `/review` | Run a multi-agent proposal review with debate rounds |
| `/run` | Full end-to-end workflow: analyze → outline → draft → review |

You can also ask general proposal questions without a command:
```
@proposal-team How should I structure my past performance volume?
```

## Agent Team

| Agent | Focus |
|-------|-------|
| **Growth Strategist** | Win themes, discriminators, competitive positioning |
| **Solution Architect** | Solution coherence, staffing, technology alignment |
| **Subject Matter Expert** | Technical correctness, methodology, feasibility |
| **Compliance Reviewer** | Requirements coverage, Section L/M traceability |
| **Past Performance Specialist** | Relevance, STAR narratives, CPARS context |

## Workflow

1. **Setup:** `@proposal-team /setup` — creates project directories
2. **Add documents:** Place solicitation files in `solicitation/`, context in `context/`
3. **Analyze:** `@proposal-team /analyze` — produces compliance matrix and analysis
4. **Outline:** `@proposal-team /outline` — creates Blue Outline with writing instructions
5. **Draft:** `@proposal-team /draft Technical Approach` — drafts sections
6. **Review:** Move drafts to `proposal/`, then `@proposal-team /review`

Or use `@proposal-team /run` to walk through all phases with checkpoints.

## Directory Structure

After `/setup`, your project will have:

```
your-project/
├── solicitation/     ← Drop RFP, SOW, amendments here
├── proposal/         ← Drop proposal drafts here for review
├── context/          ← Win themes, proof points, capture intel
│   ├── extracted/
│   ├── program-and-customer-intel/
│   └── solutioning/
├── output/           ← Generated analysis, outlines, reports
│   └── drafts/       ← Generated draft sections
├── templates/        ← Output format templates
└── CLAUDE.md         ← System documentation
```

## Development

```bash
cd plugins/proposal-team-extension
npm install
npm run compile
```

Press `F5` in VS Code to launch the Extension Development Host and test.

## Requirements

- VS Code 1.93.0+
- GitHub Copilot or another Language Model provider
