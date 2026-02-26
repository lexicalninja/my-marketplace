"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRun = handleRun;
const workspaceFiles_1 = require("../workspaceFiles");
const analyze_1 = require("./analyze");
const outline_1 = require("./outline");
const draft_1 = require("./draft");
const review_1 = require("./review");
/**
 * /run — End-to-end proposal workflow with checkpoints.
 * Orchestrates: analyze → outline → draft → review.
 *
 * Since VS Code chat doesn't support multi-turn interactive checkpoints,
 * this command checks existing state and runs the next pending phase.
 * The user re-invokes /run to advance through phases.
 */
async function handleRun(request, stream, token, resources) {
    const ws = new workspaceFiles_1.WorkspaceFiles();
    stream.markdown('## Proposal Workflow\n\n');
    // ── Check current state ─────────────────────────────────────────
    stream.progress('Checking current project state...');
    const hasAnalysis = await ws.exists('output/solicitation-analysis.md');
    const hasMatrix = await ws.exists('output/compliance-matrix.md');
    const hasBlueOutline = await ws.exists('output/blue-outline.md');
    const hasDrafts = (await ws.listFiles('output/drafts')).length > 0;
    const hasAssessments = (await ws.listFiles('output'))
        .some((f) => f.startsWith('assessment-'));
    const hasSolicitation = (await ws.listFiles('solicitation')).length > 0;
    const hasProposal = (await ws.listFiles('proposal')).length > 0;
    const hasContext = Object.keys(await ws.readDirRecursive('context')).length > 0;
    // Parse user intent for explicit phase selection
    const userPrompt = request.prompt.trim().toLowerCase();
    // ── Route to the appropriate phase ──────────────────────────────
    // Explicit phase requests
    if (userPrompt.includes('re-analyze') || userPrompt.includes('reanalyze')) {
        stream.markdown('Re-running solicitation analysis...\n\n');
        await (0, analyze_1.handleAnalyze)(request, stream, token, resources);
        showCheckpoint(stream, 1);
        return;
    }
    if (userPrompt.includes('revise outline') || userPrompt.includes('revise all')) {
        stream.markdown('Re-running Blue Outline creation...\n\n');
        await (0, outline_1.handleOutline)(request, stream, token, resources);
        showCheckpoint(stream, 2);
        return;
    }
    if (userPrompt.includes('redraft')) {
        stream.markdown('Re-running drafting...\n\n');
        await (0, draft_1.handleDraft)(request, stream, token, resources);
        showCheckpoint(stream, 3);
        return;
    }
    // Auto-detect next phase
    if (!hasSolicitation) {
        stream.markdown('### ⚠ No Solicitation Documents\n\n' +
            'Add solicitation documents to `solicitation/` before starting the workflow.\n\n' +
            'Then run `@proposal-team /run` again.\n');
        return;
    }
    if (!hasAnalysis || !hasMatrix) {
        // Phase 1: Analyze
        stream.markdown('### Phase 1 — Solicitation Analysis\n\n');
        await (0, analyze_1.handleAnalyze)(request, stream, token, resources);
        showCheckpoint(stream, 1, hasContext);
        return;
    }
    if (!hasBlueOutline) {
        // Phase 2: Blue Outline
        if (!hasContext) {
            stream.markdown('### Waiting for Context Materials\n\n' +
                'Solicitation analysis is complete. Before building the Blue Outline:\n\n' +
                '1. Add win themes, proof points, and capture materials to `context/`\n' +
                '2. Run `@proposal-team /run proceed` to continue\n\n' +
                'Or run `@proposal-team /run proceed` to continue with `[REQUIRED]` placeholders.\n');
            if (userPrompt.includes('proceed')) {
                stream.markdown('Proceeding to Blue Outline...\n\n');
            }
            else {
                return;
            }
        }
        stream.markdown('### Phase 2 — Blue Outline\n\n');
        await (0, outline_1.handleOutline)(request, stream, token, resources);
        showCheckpoint(stream, 2);
        return;
    }
    if (!hasDrafts) {
        // Phase 3: Draft
        stream.markdown('### Phase 3 — Drafting Sections\n\n');
        const draftRequest = {
            ...request,
            prompt: request.prompt || 'all',
        };
        await (0, draft_1.handleDraft)(draftRequest, stream, token, resources);
        showCheckpoint(stream, 3);
        return;
    }
    if (!hasAssessments) {
        // Copy drafts to proposal/ if needed
        if (!hasProposal) {
            stream.progress('Copying drafts to proposal/...');
            await ws.createDirectories(['proposal']);
            const draftFiles = await ws.readDir('output/drafts');
            for (const [name, content] of Object.entries(draftFiles)) {
                await ws.writeFile(`proposal/${name}`, content);
            }
            stream.markdown('Drafts copied to `proposal/`.\n\n');
        }
        // Phase 4: Review
        stream.markdown('### Phase 4 — Proposal Review\n\n');
        await (0, review_1.handleReview)(request, stream, token, resources);
        showCheckpoint(stream, 4);
        return;
    }
    // All phases complete
    stream.markdown('### ✅ Workflow Complete\n\n');
    stream.markdown('All phases have been executed. Output files:\n\n');
    stream.markdown('| Phase | Files |\n');
    stream.markdown('|-------|-------|\n');
    stream.markdown('| Analysis | `output/solicitation-analysis.md`, `output/compliance-matrix.md` |\n');
    stream.markdown('| Blue Outline | `output/blue-outline.md`, `output/blue-outline-*.md` |\n');
    stream.markdown('| Drafts | `output/drafts/*.md` |\n');
    stream.markdown('| Review | `output/consolidated-report.md`, `output/action-tracker.md`, `output/assessment-*.md` |\n\n');
    stream.markdown('**To revise:**\n');
    stream.markdown('- `@proposal-team /run redraft [section]` — redraft a section\n');
    stream.markdown('- `@proposal-team /run re-analyze` — re-analyze (e.g., after amendment)\n');
    stream.markdown('- `@proposal-team /run revise outline` — rebuild the Blue Outline\n');
}
function showCheckpoint(stream, phase, hasContext) {
    stream.markdown('\n---\n\n');
    switch (phase) {
        case 1:
            stream.markdown('### Checkpoint 1 — Analysis Complete\n\n');
            stream.markdown('**Next steps:**\n');
            stream.markdown('- **`@proposal-team /run proceed`** — continue to Blue Outline\n');
            if (!hasContext) {
                stream.markdown('- **Add context materials** to `context/` first (win themes, proof points, solution strategy)\n');
            }
            stream.markdown('- **`@proposal-team /run re-analyze`** — re-run analysis (e.g., after amendment)\n');
            stream.markdown('- Stop here and review `output/solicitation-analysis.md` before continuing\n');
            break;
        case 2:
            stream.markdown('### Checkpoint 2 — Blue Outline Complete\n\n');
            stream.markdown('**Next steps:**\n');
            stream.markdown('- **`@proposal-team /run proceed`** — start drafting all sections\n');
            stream.markdown('- **`@proposal-team /run revise outline`** — rebuild the outline\n');
            stream.markdown('- Review `output/blue-outline.md` and fill any `[REQUIRED]` placeholders before drafting\n');
            break;
        case 3:
            stream.markdown('### Checkpoint 3 — Drafts Complete\n\n');
            stream.markdown('**Next steps:**\n');
            stream.markdown('- **`@proposal-team /run proceed`** — move drafts to `proposal/` and run review\n');
            stream.markdown('- **`@proposal-team /run redraft [section]`** — redraft a specific section\n');
            stream.markdown('- Review drafts in `output/drafts/` and fill `[REQUIRED]` placeholders\n');
            break;
        case 4:
            stream.markdown('### Checkpoint 4 — Review Complete\n\n');
            stream.markdown('**Next steps:**\n');
            stream.markdown('- **Done** — all outputs are in `output/`\n');
            stream.markdown('- **`@proposal-team /run redraft [section]`** — revise and re-review\n');
            stream.markdown('- Review `output/consolidated-report.md` and `output/action-tracker.md`\n');
            break;
    }
}
//# sourceMappingURL=run.js.map