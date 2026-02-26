"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSetup = handleSetup;
const workspaceFiles_1 = require("../workspaceFiles");
/**
 * /setup — One-time project setup.
 * Creates directories, copies templates, and creates a CLAUDE.md overview.
 */
async function handleSetup(_request, stream, _token, resources) {
    const ws = new workspaceFiles_1.WorkspaceFiles();
    // ── Step 1: Assess current state ────────────────────────────────
    stream.progress('Assessing current project state...');
    const dirs = [
        'solicitation',
        'proposal',
        'context',
        'context/extracted',
        'context/program-and-customer-intel',
        'context/solutioning',
        'output',
        'templates',
    ];
    const existing = [];
    const toCreate = [];
    for (const dir of dirs) {
        if (await ws.dirExists(dir)) {
            existing.push(dir);
        }
        else {
            toCreate.push(dir);
        }
    }
    stream.markdown('## Project Setup\n\n');
    if (existing.length > 0) {
        stream.markdown(`**Already exist:** ${existing.map(d => '`' + d + '/`').join(', ')}\n\n`);
    }
    // ── Step 2: Create directories ──────────────────────────────────
    if (toCreate.length > 0) {
        stream.progress('Creating directories...');
        await ws.createDirectories(toCreate);
        stream.markdown(`**Created:** ${toCreate.map(d => '`' + d + '/`').join(', ')}\n\n`);
    }
    else {
        stream.markdown('All directories already exist.\n\n');
    }
    // Create .gitkeep in empty directories
    for (const dir of dirs) {
        const files = await ws.listFiles(dir);
        if (files.length === 0) {
            try {
                await ws.writeFile(`${dir}/.gitkeep`, '');
            }
            catch {
                // Skip if can't write
            }
        }
    }
    // ── Step 3: Copy templates ──────────────────────────────────────
    stream.progress('Copying templates...');
    const templateNames = [
        'action-tracker',
        'agent-assessment',
        'blue-outline-compliance-traceability',
        'blue-outline-page-allocation',
        'blue-outline-row',
        'consolidated-report',
        'debate-round',
        'section-score-card',
    ];
    const copied = [];
    const skipped = [];
    for (const name of templateNames) {
        const destPath = `templates/${name}.md`;
        if (await ws.exists(destPath)) {
            skipped.push(name);
        }
        else {
            const content = await resources.getTemplate(name);
            await ws.writeFile(destPath, content);
            copied.push(name);
        }
    }
    if (copied.length > 0) {
        stream.markdown(`**Templates copied:** ${copied.map(t => '`' + t + '.md`').join(', ')}\n\n`);
    }
    if (skipped.length > 0) {
        stream.markdown(`**Templates skipped (already exist):** ${skipped.map(t => '`' + t + '.md`').join(', ')}\n\n`);
    }
    // ── Step 4: Create CLAUDE.md ────────────────────────────────────
    if (await ws.exists('CLAUDE.md')) {
        stream.markdown('**CLAUDE.md** already exists — skipped.\n\n');
    }
    else {
        stream.progress('Creating CLAUDE.md...');
        const claudeMd = generateClaudeMd();
        await ws.writeFile('CLAUDE.md', claudeMd);
        stream.markdown('**Created CLAUDE.md** with system documentation.\n\n');
    }
    // ── Step 5: Report ──────────────────────────────────────────────
    stream.markdown('---\n\n');
    stream.markdown('## Next Steps\n\n');
    stream.markdown('1. Add solicitation documents to `solicitation/`\n');
    stream.markdown('2. Add win themes, proof points, and capture materials to `context/`\n');
    stream.markdown('3. Run `@proposal-team /analyze` to analyze the solicitation\n');
    stream.markdown('4. Run `@proposal-team /outline` to create the Blue Outline\n');
    stream.markdown('5. Run `@proposal-team /draft` to draft proposal sections\n');
    stream.markdown('6. Move drafts to `proposal/` and run `@proposal-team /review`\n');
}
function generateClaudeMd() {
    return `# Federal Procurement Proposal Review System

## Overview
Multi-agent proposal review system for federal procurement proposals. A Prop Manager orchestrates 5 specialized reviewer agents through a structured deliberative workflow including cross-agent debate rounds.

## Directory Conventions

| Directory | Purpose |
|-----------|---------|
| \`solicitation/\` | **INPUT** — Drop solicitation documents here (RFP, RFI, Sources Sought, Task Order) |
| \`proposal/\` | **INPUT** — Drop proposal draft sections/volumes here |
| \`context/\` | **INPUT** — Win themes, proof points, competitive intel, past performance |
| \`output/\` | **OUTPUT** — All generated review reports and assessments |
| \`templates/\` | Structured output format templates all agents must follow |

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

## Skills (Chat Commands)

| Command | When to Use |
|---------|-------------|
| \`/setup\` | One-time setup — creates directories and copies templates |
| \`/analyze\` | When RFP drops — extracts requirements, evaluation factors, compliance matrix, risk flags, Q&A candidates |
| \`/outline\` | Before drafting — builds section-by-section writing instructions from solicitation + context |
| \`/draft\` | Produces proposal-ready prose for one or more sections using Blue Outline + context |
| \`/review\` | After drafting — runs the full multi-agent review of a proposal draft |
| \`/run\` | End-to-end orchestration: analyze → outline → draft → review with checkpoints |

## Typical Workflow

1. Run \`@proposal-team /setup\` to initialize project structure
2. Place solicitation documents in \`solicitation/\`
3. Run \`@proposal-team /analyze\` → produces compliance matrix and solicitation analysis in \`output/\`
4. Place win themes, proof points, and capture materials in \`context/\`
5. Run \`@proposal-team /outline\` → uses existing solicitation analysis; outputs writing instructions in \`output/\`
6. Run \`@proposal-team /draft\` → produces draft prose in \`output/drafts/\`; fill [REQUIRED] placeholders with real content
7. Move polished drafts to \`proposal/\`
8. Run \`@proposal-team /review\` → outputs review reports in \`output/\`

## Writing Standards
Proposal writing guidelines (voice, structure, PTP framework, quality gates) are built into the extension and passed to all agents during review.
`;
}
//# sourceMappingURL=setup.js.map