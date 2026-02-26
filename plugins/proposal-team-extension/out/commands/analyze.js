"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAnalyze = handleAnalyze;
const workspaceFiles_1 = require("../workspaceFiles");
const lmAgent_1 = require("../lmAgent");
/**
 * /analyze — Solicitation analysis.
 * 5-phase workflow: Ingest → Extract → Interpret → Write → Report.
 */
async function handleAnalyze(request, stream, token, resources) {
    const ws = new workspaceFiles_1.WorkspaceFiles();
    const model = await (0, lmAgent_1.selectModel)();
    // ── Phase 1: Ingest ─────────────────────────────────────────────
    stream.progress('Phase 1 — Ingesting solicitation documents...');
    const solicitationFiles = await ws.readDirRecursive('solicitation');
    const fileNames = Object.keys(solicitationFiles);
    if (fileNames.length === 0) {
        stream.markdown('## ⚠ No Solicitation Documents Found\n\n' +
            'Add your solicitation documents (RFP, RFI, SOW/PWS, amendments) to the `solicitation/` directory, then run this command again.\n');
        return;
    }
    stream.markdown(`## Solicitation Analysis\n\n`);
    stream.markdown(`Found **${fileNames.length}** document(s) in \`solicitation/\`:\n`);
    for (const name of fileNames) {
        stream.markdown(`- \`${name}\`\n`);
    }
    stream.markdown('\n');
    // Build solicitation content for the prompt
    const solicitationContent = Object.entries(solicitationFiles)
        .map(([name, content]) => `### File: ${name}\n\n${content}`)
        .join('\n\n---\n\n');
    // ── Phases 2–4: Extract, Interpret, Write ───────────────────────
    stream.progress('Phases 2–4 — Extracting, analyzing, and writing outputs...');
    const analysisPrompt = buildAnalysisPrompt(solicitationContent, request.prompt);
    const analysisResult = await (0, lmAgent_1.sendPromptStreaming)(model, analysisPrompt, stream, token);
    // ── Parse and write outputs ─────────────────────────────────────
    stream.progress('Writing output files...');
    // Try to extract structured sections
    const complianceMatrix = extractSection(analysisResult, 'COMPLIANCE_MATRIX');
    const solicitationAnalysis = extractSection(analysisResult, 'SOLICITATION_ANALYSIS');
    if (complianceMatrix) {
        await ws.createDirectories(['output']);
        await ws.writeFile('output/compliance-matrix.md', complianceMatrix);
    }
    if (solicitationAnalysis) {
        await ws.createDirectories(['output']);
        await ws.writeFile('output/solicitation-analysis.md', solicitationAnalysis);
    }
    // If we couldn't extract structured sections, write the full output
    if (!complianceMatrix && !solicitationAnalysis) {
        await ws.createDirectories(['output']);
        await ws.writeFile('output/solicitation-analysis.md', analysisResult);
    }
    // ── Phase 5: Report ─────────────────────────────────────────────
    stream.markdown('\n\n---\n\n');
    stream.markdown('## Output Files\n\n');
    if (solicitationAnalysis || !complianceMatrix) {
        stream.markdown('- `output/solicitation-analysis.md`\n');
    }
    if (complianceMatrix) {
        stream.markdown('- `output/compliance-matrix.md`\n');
    }
    stream.markdown('\nReady for `@proposal-team /outline` to build the Blue Outline.\n');
}
function buildAnalysisPrompt(solicitationContent, userPrompt) {
    return `You are the Prop Manager performing a structured solicitation analysis for a federal procurement proposal.

ABSOLUTE RULE: NO FABRICATION — Never invent, assume, or infer any information not explicitly present in the solicitation documents provided below.

## Your Task

Analyze the solicitation documents below and produce TWO outputs:

### Output 1: Solicitation Analysis
Structure it exactly as follows:
- Solicitation Overview (2-3 paragraph summary)
- Solicitation type (Full RFP / Sources Sought / Task Order)
- Agency, solicitation number, due date, contract type
- Evaluation Factor Summary (table: Factor | Weight/Priority | Interpretation)
- Key Requirements Summary (organized by functional area)
- Solicitation Risk Flags (bulleted by risk type: Compliance, Scope, Technical, Competition, Timeline, Evaluation)
- Q&A Candidates (table: # | Issue | Proposed Question | Impact if Not Clarified)
- Win Theme Indicators (bulleted)

### Output 2: Compliance Matrix
Structure it exactly as follows:
- Section L Requirements (table: Req ID | Source | Requirement | Volume/Section | Notes)
- Section M Evaluation Factors (table: Factor ID | Factor | Weight/Priority | Key Scoring Signals)
- SOW/PWS Requirements (table: Req ID | Source | Requirement | Functional Area | Risk Level)

## CRITICAL: Output Format

Wrap Output 1 in markers like this:
<!-- BEGIN SOLICITATION_ANALYSIS -->
(content here)
<!-- END SOLICITATION_ANALYSIS -->

Wrap Output 2 in markers like this:
<!-- BEGIN COMPLIANCE_MATRIX -->
(content here)
<!-- END COMPLIANCE_MATRIX -->

## Solicitation Documents

${solicitationContent}

${userPrompt ? `## Additional User Instructions\n\n${userPrompt}` : ''}

Begin your analysis now. Be thorough but concise. Extract every "shall" and "will" statement. Flag risks and ambiguities.`;
}
function extractSection(text, sectionName) {
    const beginMarker = `<!-- BEGIN ${sectionName} -->`;
    const endMarker = `<!-- END ${sectionName} -->`;
    const startIdx = text.indexOf(beginMarker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        return null;
    }
    return text.substring(startIdx + beginMarker.length, endIdx).trim();
}
//# sourceMappingURL=analyze.js.map