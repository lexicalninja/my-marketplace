# /setup-project

You are setting up the **Federal Procurement Proposal Review System** directory structure in the current project. This skill is run once after installing the `.claude/` folder into a new project.

## What This Skill Does

Creates the required input/output directories, copies template files, and creates a `CLAUDE.md` if one does not already exist — so the `/review-proposal` skill can run correctly.

---

## Steps

Execute these steps sequentially. Announce progress to the user as you go.

---

### Step 1 — Assess Current State

Use Glob to check which of these already exist:
- `solicitation/`
- `proposal/`
- `context/`
- `output/`
- `templates/`
- `CLAUDE.md`

Tell the user what already exists and what will be created.

---

### Step 2 — Create Working Directories

Run this bash command to create the full directory tree:

```bash
mkdir -p solicitation proposal context/extracted context/program-and-customer-intel context/solutioning output templates
```

Then create `.gitkeep` placeholder files in each directory so they are tracked by git. Only create `.gitkeep` in directories that are empty (i.e., do not add `.gitkeep` if the directory already had content):

```bash
touch solicitation/.gitkeep proposal/.gitkeep context/.gitkeep context/extracted/.gitkeep context/program-and-customer-intel/.gitkeep context/solutioning/.gitkeep output/.gitkeep
```

---

### Step 3 — Copy Templates

For each file listed below, check if it already exists in `templates/`. If it does **not** exist, read the source file from `.claude/templates/` and write it to `templates/`. Do **not** overwrite files that already exist.

| Source | Destination |
|--------|-------------|
| `.claude/templates/action-tracker.md` | `templates/action-tracker.md` |
| `.claude/templates/agent-assessment.md` | `templates/agent-assessment.md` |
| `.claude/templates/blue-outline-compliance-traceability.md` | `templates/blue-outline-compliance-traceability.md` |
| `.claude/templates/blue-outline-page-allocation.md` | `templates/blue-outline-page-allocation.md` |
| `.claude/templates/blue-outline-row.md` | `templates/blue-outline-row.md` |
| `.claude/templates/consolidated-report.md` | `templates/consolidated-report.md` |
| `.claude/templates/debate-round.md` | `templates/debate-round.md` |
| `.claude/templates/section-score-card.md` | `templates/section-score-card.md` |

---

### Step 4 — Create CLAUDE.md (if missing)

Check if `CLAUDE.md` exists in the project root. If it already exists, skip this step and note it was skipped.

If it does **not** exist, create `CLAUDE.md` with the following content exactly:

---

```markdown
# Federal Procurement Proposal Review System

## Overview
Multi-agent proposal review system for federal procurement proposals. A Prop Manager (the `/review-proposal` skill) orchestrates 4 specialized reviewer agents through a 6-phase deliberative workflow including cross-agent debate rounds.

## Directory Conventions

| Directory | Purpose |
|-----------|---------|
| `solicitation/` | **INPUT** — Drop solicitation documents here (RFP, RFI, Sources Sought, Task Order) |
| `proposal/` | **INPUT** — Drop proposal draft sections/volumes here |
| `context/` | **INPUT** — Win themes, proof points, competitive intel, past performance |
| `output/` | **OUTPUT** — All generated review reports and assessments |
| `templates/` | Structured output format templates all agents must follow |
| `.claude/agents/` | Agent role definitions for the 4 specialized reviewers |
| `.claude/skills/review-proposal/` | The Prop Manager orchestrator skill |

## Agent Roles

| Agent | Focus |
|-------|-------|
| **Growth Strategist** | Win themes, discriminators, competitive positioning, "so what?" factor |
| **Solution Architect** | Solution coherence, staffing alignment, tech fit, benefits traceability |
| **Subject Matter Expert** | Technical correctness, methodology fit, best practices, feasibility |
| **Compliance Reviewer** | Requirements coverage, Section L/M traceability, format compliance |
| **Past Performance Specialist** | Relevance, STAR narrative quality, CPARS context, POC completeness, coverage gaps |

## Scoring System

All agents use a **High / Medium / Low** confidence scoring system per proposal section:

| Score | Meaning |
|-------|---------|
| **High (H)** | Section is strong, well-aligned with requirements, minimal changes needed |
| **Medium (M)** | Section is adequate but has notable gaps or weaknesses requiring attention |
| **Low (L)** | Section has significant issues that risk scoring poorly with evaluators |

## Skills

| Skill | When to Use |
|-------|-------------|
| `/analyze-solicitation` | Immediately when RFP drops — extracts requirements, evaluation factors, compliance matrix, risk flags, Q&A candidates |
| `/create-blue-outline` | Before drafting — builds section-by-section writing instructions from solicitation + context |
| `/draft-section` | Produces proposal-ready prose for one or more sections using Blue Outline + context; outputs to `output/drafts/` |
| `/review-proposal` | After drafting — runs the full 6-phase multi-agent review of a proposal draft |

## Typical Workflow

1. Place solicitation documents in `solicitation/`
2. Run `/analyze-solicitation` → produces compliance matrix and solicitation analysis in `output/`
3. Place win themes, proof points, and capture materials in `context/`
4. Run `/create-blue-outline` → uses existing solicitation analysis; outputs writing instructions in `output/`
5. Run `/draft-section` → produces draft prose in `output/drafts/`; fill [REQUIRED] placeholders with real content
6. Move polished drafts to `proposal/`
7. Run `/review-proposal` → outputs review reports in `output/`

## Writing Standards
Proposal writing guidelines (voice, structure, PTP framework, quality gates) are in `.claude/writing-standards.md`. The Prop Manager passes the full standards to all agents during Phase 4 section assessment.

## Conventions
- Agents produce structured, concise outputs following templates in `templates/`
- Debate rounds pass only changes and key findings (not full previous outputs) to manage context
- The Prop Manager reads files and passes contents in Task prompts — agents do not read files themselves
- Maximum 3 debate rounds per debate phase before the Prop Manager makes final determinations
```

---

### Step 5 — Report to User

Provide a clean summary:
- Which directories were created (or already existed)
- Which template files were copied (or skipped because they already existed)
- Whether `CLAUDE.md` was created or already existed
- **Next steps:** Add solicitation documents to `solicitation/`, add proposal draft to `proposal/`, optionally add supporting materials to `context/`, then run `/review-proposal`
