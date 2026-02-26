import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
import { WorkspaceFiles } from '../workspaceFiles';
import { selectModel, sendPromptStreaming } from '../lmAgent';

/**
 * /draft — Draft one or more proposal sections.
 * 4-phase workflow: Identify → Load Context → Draft → Output.
 */
export async function handleDraft(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    resources: ResourceLoader
): Promise<void> {
    const ws = new WorkspaceFiles();
    const model = await selectModel();

    stream.markdown('## Section Drafting\n\n');

    // ── Phase 1: Identify target sections ───────────────────────────
    stream.progress('Phase 1 — Identifying target sections...');

    const hasBlueOutline = await ws.exists('output/blue-outline.md');
    let blueOutline = '';
    if (hasBlueOutline) {
        blueOutline = await ws.readFile('output/blue-outline.md');
        stream.markdown('Using Blue Outline from `output/blue-outline.md`.\n\n');
    }

    const userSection = request.prompt.trim();
    if (!userSection && !hasBlueOutline) {
        stream.markdown(
            '### What to Draft?\n\n' +
            'Please specify which section to draft. You can:\n' +
            '- Name a section: `@proposal-team /draft Technical Approach`\n' +
            '- Draft all: `@proposal-team /draft all`\n' +
            '- Run `@proposal-team /outline` first to generate the Blue Outline\n'
        );
        return;
    }

    // ── Phase 2: Load context ───────────────────────────────────────
    stream.progress('Phase 2 — Loading context materials...');

    const writingStandards = await resources.getWritingStandards();

    let solicitationAnalysis = '';
    if (await ws.exists('output/solicitation-analysis.md')) {
        solicitationAnalysis = await ws.readFile('output/solicitation-analysis.md');
    }

    let complianceMatrix = '';
    if (await ws.exists('output/compliance-matrix.md')) {
        complianceMatrix = await ws.readFile('output/compliance-matrix.md');
    }

    const contextFiles = await ws.readDirRecursive('context');
    const contextContent = Object.keys(contextFiles).length > 0
        ? Object.entries(contextFiles)
              .map(([name, content]) => `### File: ${name}\n\n${content}`)
              .join('\n\n---\n\n')
        : '';

    if (Object.keys(contextFiles).length === 0) {
        stream.markdown('> **Note:** `context/` is empty. Drafts will have more `[REQUIRED]` placeholders.\n\n');
    }

    // ── Phase 3: Draft ──────────────────────────────────────────────
    stream.progress('Phase 3 — Drafting section(s)...');

    const draftPrompt = buildDraftPrompt({
        sectionRequest: userSection || 'all sections listed in the Blue Outline',
        blueOutline,
        writingStandards,
        solicitationAnalysis,
        complianceMatrix,
        contextContent,
    });

    stream.markdown('---\n\n');
    const draftResult = await sendPromptStreaming(model, draftPrompt, stream, token);

    // ── Phase 4: Write output ───────────────────────────────────────
    stream.progress('Phase 4 — Writing draft files...');

    await ws.createDirectories(['output', 'output/drafts']);

    // Generate a slug from the section name
    const slug = userSection
        ? userSection.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : 'full-draft';

    const outputPath = `output/drafts/${slug}.md`;
    await ws.writeFile(outputPath, draftResult);

    // Count placeholders
    const requiredCount = (draftResult.match(/\[.*?REQUIRED.*?\]/g) || []).length;
    const graphicCount = (draftResult.match(/\[GRAPHIC:.*?\]/g) || []).length;

    stream.markdown('\n\n---\n\n### Draft Output\n\n');
    stream.markdown(`- **File:** \`${outputPath}\`\n`);
    stream.markdown(`- **[REQUIRED] placeholders:** ${requiredCount}\n`);
    stream.markdown(`- **[GRAPHIC] placeholders:** ${graphicCount}\n\n`);

    if (requiredCount > 0) {
        stream.markdown('> Fill `[REQUIRED]` placeholders with real content before submitting.\n\n');
    }

    stream.markdown('**Next:** Move drafts to `proposal/` and run `@proposal-team /review`.\n');
}

interface DraftContext {
    sectionRequest: string;
    blueOutline: string;
    writingStandards: string;
    solicitationAnalysis: string;
    complianceMatrix: string;
    contextContent: string;
}

function buildDraftPrompt(ctx: DraftContext): string {
    return `You are a federal proposal writer with expertise in winning government contracts. You are drafting proposal sections as proposal-ready prose.

═══════════════════════════════════════
ABSOLUTE RULE: NO FABRICATION
═══════════════════════════════════════
Every sentence must be grounded in the source materials provided below.

You may NOT invent:
- Tool names, software, or platform names not in the source materials
- Metrics, statistics, percentages, or numbers not in the source materials
- Past performance references, contract numbers, or project names not provided
- Staff credentials, clearance levels, or qualifications not stated
- Process names, methodology names, or framework names not in the source materials

When required information is MISSING, use typed placeholders:
- [TOOL NAME REQUIRED: describe what tool is needed]
- [METRIC REQUIRED: describe what measurement is needed]
- [PROOF POINT REQUIRED: describe what evidence would support this claim]
- [STAFF ROLE REQUIRED: describe the function needed]
- [PROCESS REQUIRED: describe the process needed]

A [REQUIRED] placeholder is always better than a fabricated detail.

═══════════════════════════════════════
WRITING STANDARDS
═══════════════════════════════════════
${ctx.writingStandards}

═══════════════════════════════════════
SECTION TO DRAFT
═══════════════════════════════════════
${ctx.sectionRequest}

${ctx.blueOutline ? `═══════════════════════════════════════\nBLUE OUTLINE\n═══════════════════════════════════════\n${ctx.blueOutline}` : ''}

${ctx.solicitationAnalysis ? `═══════════════════════════════════════\nSOLICITATION ANALYSIS\n═══════════════════════════════════════\n${ctx.solicitationAnalysis}` : ''}

${ctx.complianceMatrix ? `═══════════════════════════════════════\nCOMPLIANCE MATRIX\n═══════════════════════════════════════\n${ctx.complianceMatrix}` : ''}

${ctx.contextContent ? `═══════════════════════════════════════\nCONTEXT MATERIALS\n═══════════════════════════════════════\n${ctx.contextContent}` : ''}

═══════════════════════════════════════
DRAFTING INSTRUCTIONS
═══════════════════════════════════════

1. **Opening — Outcome First:** Lead with customer benefit or mission outcome. Not "We will provide..."
2. **PWS/SOW Language:** Use exact solicitation terms — do not paraphrase
3. **PTP Framework:** For every requirement identify People (roles), Tools (by name), and Processes (specific methodology). Missing = [REQUIRED] placeholder.
4. **Win Themes:** Weave into evidence and outcomes — not standalone slogans
5. **Proof Points:** Connect benefits to evidence. Missing proof = [PROOF POINT REQUIRED]
6. **Graphics:** Insert [GRAPHIC: description] and [CAPTION: key takeaway] on their own lines
7. **Cross-References:** Use [CROSS-REF: Section X — more detail on Y]
8. **Writing Quality:** Active voice, paragraphs ≤ 6 lines, Grade 8 readability, no jargon/clichés
9. **Length:** Target pages from Blue Outline (~300-400 words/page for text)
10. **Format:** Section title as heading, subheadings for sub-requirements, tables for comparisons

Write complete, proposal-ready prose. Begin directly with the section heading and content — no preamble or commentary.`;
}
