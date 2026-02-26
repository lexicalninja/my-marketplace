import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
import { WorkspaceFiles } from '../workspaceFiles';
import {
    selectModel,
    sendPrompt,
    sendPromptStreaming,
    runAgentsParallel,
    formatAgentOutputs,
    AgentRequest,
} from '../lmAgent';

/**
 * /outline — Create a Blue Outline.
 * 4-phase workflow: Ingest → Framework → Agent Content → Compile.
 */
export async function handleOutline(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    resources: ResourceLoader
): Promise<void> {
    const ws = new WorkspaceFiles();
    const model = await selectModel();

    stream.markdown('## Blue Outline Creation\n\n');

    // ── Phase 1: Ingest & Analyze ───────────────────────────────────
    stream.progress('Phase 1 — Ingesting solicitation and context...');

    let phase1Summary = '';

    // Check for existing solicitation analysis
    const hasAnalysis = await ws.exists('output/solicitation-analysis.md');
    const hasMatrix = await ws.exists('output/compliance-matrix.md');

    if (hasAnalysis && hasMatrix) {
        const analysis = await ws.readFile('output/solicitation-analysis.md');
        const matrix = await ws.readFile('output/compliance-matrix.md');
        phase1Summary = `## Existing Solicitation Analysis\n\n${analysis}\n\n## Compliance Matrix\n\n${matrix}`;
        stream.markdown('Using existing solicitation analysis from `output/`.\n\n');
    } else {
        // Read raw solicitation files
        const solicitationFiles = await ws.readDirRecursive('solicitation');
        if (Object.keys(solicitationFiles).length === 0) {
            stream.markdown(
                '### ⚠ No Solicitation Documents Found\n\n' +
                'Add solicitation documents to `solicitation/` or run `@proposal-team /analyze` first.\n'
            );
            return;
        }
        phase1Summary = Object.entries(solicitationFiles)
            .map(([name, content]) => `### File: ${name}\n\n${content}`)
            .join('\n\n---\n\n');
        stream.markdown('Reading raw solicitation files (no prior analysis found).\n\n');
    }

    // Read context files
    const contextFiles = await ws.readDirRecursive('context');
    const contextContent = Object.keys(contextFiles).length > 0
        ? Object.entries(contextFiles)
              .map(([name, content]) => `### File: ${name}\n\n${content}`)
              .join('\n\n---\n\n')
        : '';

    if (Object.keys(contextFiles).length === 0) {
        stream.markdown('> **Note:** `context/` is empty. Win themes, proof points, and solution columns will use `[REQUIRED]` placeholders.\n\n');
    } else {
        stream.markdown(`Loaded **${Object.keys(contextFiles).length}** context file(s).\n\n`);
    }

    // ── Phase 2: Build Section Framework ────────────────────────────
    stream.progress('Phase 2 — Building section framework and mapping requirements...');

    const frameworkPrompt = `You are the Prop Manager building a section framework for a federal proposal Blue Outline.

ABSOLUTE RULE: NO FABRICATION — use only information from the solicitation materials.

SOLICITATION SUMMARY:
${phase1Summary}

TASK:
1. Build a section skeleton from Section L (or equivalent instructions). One entry per required section/subsection, using exact section numbers and titles from the solicitation.
2. Map every requirement to a section:
   - Section L requirements → the section they instruct
   - SOW/PWS "shall/will" → the response section
   - Section M evaluation criteria → the section(s) where compliance is demonstrated
3. Flag orphan requirements (no section home) and empty sections (no requirement).

OUTPUT FORMAT:
Produce a numbered list of sections with their mapped requirements. Then list any orphans and empty sections.`;

    const framework = await sendPrompt(model, frameworkPrompt, token);
    stream.markdown('Section framework built.\n\n');

    // ── Phase 3: Generate Section Content (4 agents in parallel) ──
    stream.progress('Phase 3 — Running 4 agents in parallel to generate outline content...');

    const agentDefs = await resources.getCoreAgentDefinitions();
    const writingStandards = await resources.getWritingStandards();
    const blueOutlineRowTemplate = await resources.getTemplate('blue-outline-row');

    const agentPrompts: AgentRequest[] = [
        {
            name: 'Growth Strategist',
            prompt: buildGrowthStrategistPrompt(agentDefs['growth-strategist'], writingStandards, phase1Summary, contextContent, framework),
        },
        {
            name: 'Compliance Reviewer',
            prompt: buildComplianceReviewerPrompt(agentDefs['compliance-reviewer'], phase1Summary, framework),
        },
        {
            name: 'Solution Architect',
            prompt: buildSolutionArchitectPrompt(agentDefs['solution-architect'], writingStandards, phase1Summary, contextContent, framework),
        },
        {
            name: 'Subject Matter Expert',
            prompt: buildSMEPrompt(agentDefs['subject-matter-expert'], writingStandards, phase1Summary, contextContent, framework),
        },
    ];

    const agentOutputs = await runAgentsParallel(model, agentPrompts, stream, token);

    // ── Phase 4: Compile and write outputs ──────────────────────────
    stream.progress('Phase 4 — Compiling Blue Outline...');

    const compilePrompt = `You are the Prop Manager compiling a Blue Outline from 4 agent outputs.

SECTION FRAMEWORK:
${framework}

BLUE OUTLINE ROW TEMPLATE:
${blueOutlineRowTemplate}

AGENT OUTPUTS:
${formatAgentOutputs(agentOutputs)}

TASK:
1. For each section, combine all agent column outputs into a single Blue Outline row following the template format.
2. Validate:
   - Every section has content in all required columns
   - Every win theme appears in at least 2 sections
   - Count all [REQUIRED] placeholders by column type
3. Produce THREE outputs, each wrapped in markers:

<!-- BEGIN BLUE_OUTLINE -->
The complete Blue Outline with one section row per proposal section, in Section L order.
<!-- END BLUE_OUTLINE -->

<!-- BEGIN COMPLIANCE_TRACEABILITY -->
The compliance traceability matrix: every requirement mapped to a section.
<!-- END COMPLIANCE_TRACEABILITY -->

<!-- BEGIN PAGE_ALLOCATION -->
The page allocation table with totals and rationale.
<!-- END PAGE_ALLOCATION -->

Begin.`;

    stream.markdown('\n---\n\n### Compiled Blue Outline\n\n');
    const compiled = await sendPromptStreaming(model, compilePrompt, stream, token);

    // Write output files
    await ws.createDirectories(['output']);

    const blueOutline = extractSection(compiled, 'BLUE_OUTLINE');
    const traceability = extractSection(compiled, 'COMPLIANCE_TRACEABILITY');
    const pageAllocation = extractSection(compiled, 'PAGE_ALLOCATION');

    if (blueOutline) {
        await ws.writeFile('output/blue-outline.md', blueOutline);
    }
    if (traceability) {
        await ws.writeFile('output/blue-outline-compliance-traceability.md', traceability);
    }
    if (pageAllocation) {
        await ws.writeFile('output/blue-outline-page-allocation.md', pageAllocation);
    }

    // Fallback: write combined output
    if (!blueOutline && !traceability && !pageAllocation) {
        await ws.writeFile('output/blue-outline.md', compiled);
    }

    stream.markdown('\n\n---\n\n### Output Files\n\n');
    stream.markdown('- `output/blue-outline.md`\n');
    stream.markdown('- `output/blue-outline-compliance-traceability.md`\n');
    stream.markdown('- `output/blue-outline-page-allocation.md`\n');
    stream.markdown('\nReady for `@proposal-team /draft` to begin drafting sections.\n');
}

// ── Agent prompt builders ────────────────────────────────────────────

function buildGrowthStrategistPrompt(
    agentDef: string, standards: string, phase1: string, context: string, skeleton: string
): string {
    return `You are the Growth Strategist building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
${agentDef}

WRITING STANDARDS:
${standards}

SOLICITATION SUMMARY (Phase 1):
${phase1}

CONTEXT MATERIALS:
${context || '[No context materials provided]'}

SECTION SKELETON:
${skeleton}

TASK: For every section in the skeleton, produce the following columns.

Column — "Problem We're Solving":
- The specific customer pain point this section addresses
- Written from the customer's perspective
- Use only information from the solicitation or context materials
- If unknown: [CUSTOMER PROBLEM REQUIRED]

Column — "Win Themes":
- 1-2 win themes from context materials for this section
- Distribute themes across multiple sections
- If not provided: [WIN THEMES REQUIRED — provide win theme cards in context/]

Column — "Value / Proof Points":
- Customer benefits + evidence from context materials
- Format: "Value: [benefit] | Proof: [evidence]"
- For missing proof: [PROOF POINT REQUIRED: describe needed evidence]

ABSOLUTE RULE: Never invent win themes, proof points, metrics, or customer problems. Missing info gets [REQUIRED] placeholders.

Organize output by section number.`;
}

function buildComplianceReviewerPrompt(agentDef: string, phase1: string, skeleton: string): string {
    return `You are the Compliance Reviewer building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
${agentDef}

SOLICITATION SUMMARY (Phase 1):
${phase1}

SECTION SKELETON:
${skeleton}

TASK: For every section in the skeleton, produce the following columns.

Column — "Requirement":
- Verbatim Section L instruction, SOW/PWS requirement, or evaluation criterion
- Use exact RFP language — never paraphrase
- List all requirements if a section addresses multiple

Column — "Our Interpretation":
- 2-3 sentences: what the evaluator is asking, what would impress them, what would concern them if missing
- Note ambiguities and assumptions

Also produce at the end:
- List of orphan requirements (no section home)
- List of sections with no driving requirement

ABSOLUTE RULE: Use only verbatim language from the solicitation for the Requirement column.

Organize output by section number.`;
}

function buildSolutionArchitectPrompt(
    agentDef: string, standards: string, phase1: string, context: string, skeleton: string
): string {
    return `You are the Solution Architect building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
${agentDef}

WRITING STANDARDS:
${standards}

SOLICITATION SUMMARY (Phase 1):
${phase1}

CONTEXT MATERIALS:
${context || '[No context materials provided]'}

SECTION SKELETON:
${skeleton}

TASK: For every section in the skeleton, produce:

Column — "Solution":
- Specific solution element or approach from context materials
- If missing: [SOLUTION APPROACH REQUIRED: describe needed info]

Column — "Pages Allocated":
- Recommended page count per section
- More for higher-weighted factors, top win themes, complex sections
- Account for graphics (~25-30% of space)
- Total must equal page limit. If no limit found: [PAGE LIMIT NOT FOUND — confirm with user]
- One-line rationale for above-average allocations

Column — "Graphics":
- 1-2 graphic concepts per major section (skip admin sections)
- Format: graphic type + key message (Process Diagram, Org Chart, Architecture Diagram, Timeline, Comparison Matrix, Infographic, Hub-and-Spoke, Layered Stack, Before/After)

ABSOLUTE RULE: Do not invent solution approaches, tool names, or technical details.

Organize output by section number.`;
}

function buildSMEPrompt(
    agentDef: string, standards: string, phase1: string, context: string, skeleton: string
): string {
    return `You are the Subject Matter Expert building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
${agentDef}

WRITING STANDARDS:
${standards}

SOLICITATION SUMMARY (Phase 1):
${phase1}

CONTEXT MATERIALS:
${context || '[No context materials provided]'}

SECTION SKELETON:
${skeleton}

TASK: For every section in the skeleton, produce:

Column — "Our Plan":
- How this section will be written: content type, structure, depth
- Specific topics to cover (3-5 bullets max)
- Apply PTP Framework: identify People, Tools (by name from context), and Processes
- If tools not in context: [TOOL NAME REQUIRED for X function]
- Note cross-references to other sections

ABSOLUTE RULE: Plan based only on source materials. Flag gaps with [REQUIRED] placeholders.

Organize output by section number.`;
}

function extractSection(text: string, sectionName: string): string | null {
    const beginMarker = `<!-- BEGIN ${sectionName} -->`;
    const endMarker = `<!-- END ${sectionName} -->`;
    const startIdx = text.indexOf(beginMarker);
    const endIdx = text.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        return null;
    }

    return text.substring(startIdx + beginMarker.length, endIdx).trim();
}
