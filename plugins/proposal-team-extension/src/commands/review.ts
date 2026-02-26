import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
import { WorkspaceFiles } from '../workspaceFiles';
import {
    selectModel,
    sendPrompt,
    sendPromptStreaming,
    runAgentsParallel,
    runDebate,
    formatAgentOutputs,
    AgentRequest,
    AgentResponse,
} from '../lmAgent';

/**
 * /review — Multi-agent proposal review.
 * 6-phase workflow: Ingest → Alignment Debate → Context → Assessment → Reconciliation → Report.
 */
export async function handleReview(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    resources: ResourceLoader
): Promise<void> {
    const ws = new WorkspaceFiles();
    const model = await selectModel();

    stream.markdown('## Multi-Agent Proposal Review\n\n');

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1 — Solicitation Ingestion
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 1 — Ingesting solicitation and proposal...');

    const solicitationFiles = await ws.readDirRecursive('solicitation');
    const proposalFiles = await ws.readDirRecursive('proposal');

    if (Object.keys(solicitationFiles).length === 0) {
        stream.markdown('### ⚠ No Solicitation Documents\nAdd documents to `solicitation/` first.\n');
        return;
    }
    if (Object.keys(proposalFiles).length === 0) {
        stream.markdown('### ⚠ No Proposal Documents\nAdd proposal drafts to `proposal/` first.\n');
        return;
    }

    const solicitationContent = Object.entries(solicitationFiles)
        .map(([name, content]) => `### ${name}\n\n${content}`)
        .join('\n\n---\n\n');

    const proposalContent = Object.entries(proposalFiles)
        .map(([name, content]) => `### ${name}\n\n${content}`)
        .join('\n\n---\n\n');

    const proposalSections = Object.keys(proposalFiles);

    // Generate Phase 1 summary
    const phase1Prompt = `You are the Prop Manager performing Phase 1 ingestion for a proposal review.

SOLICITATION DOCUMENTS:
${solicitationContent}

PROPOSAL DOCUMENTS:
${proposalContent}

TASK:
1. Detect proposal type (Full RFP / Sources Sought / Task Order)
2. Extract key requirements and SOW/PWS items
3. Extract evaluation criteria (Section M) with weights/priorities
4. Extract Section L structure and formatting requirements
5. List proposal sections found

Produce a concise Phase 1 summary covering all of the above.`;

    const phase1Summary = await sendPrompt(model, phase1Prompt, token);
    await ws.createDirectories(['output']);
    await ws.writeFile('output/phase-1-solicitation-summary.md', phase1Summary);
    stream.markdown('Phase 1 complete — solicitation summary written.\n\n');

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2 — Requirements Alignment Debate
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 2 — Requirements alignment debate...');

    const agentDefs = await resources.getCoreAgentDefinitions();
    const debateTemplate = await resources.getTemplate('debate-round');

    const agentNames = Object.keys(agentDefs);

    const debateResult = await runDebate(
        model,
        3, // max rounds
        (round, previousOutputs) => {
            return agentNames.map((name) => ({
                name: formatAgentName(name),
                prompt: round === 1
                    ? buildAlignmentPrompt(agentDefs[name], formatAgentName(name), phase1Summary)
                    : buildAlignmentFollowUpPrompt(
                          agentDefs[name],
                          formatAgentName(name),
                          phase1Summary,
                          previousOutputs || []
                      ),
            }));
        },
        (outputs) => {
            // Simple convergence test: check if outputs mention agreement
            const agreedCount = outputs.filter((o) =>
                o.text.toLowerCase().includes('agree') || o.text.toLowerCase().includes('consensus')
            ).length;
            return agreedCount >= 3;
        },
        stream,
        token
    );

    // Write Prop Manager determination
    const alignmentSummary = formatAgentOutputs(debateResult.rounds[debateResult.rounds.length - 1]);
    const phase2Determination = await sendPrompt(
        model,
        `You are the Prop Manager. Based on the following agent positions from the requirements alignment debate, produce a determination:
- Consensus priorities
- Remaining disagreements and your ruling on each
- Unified requirements framework for section assessment

AGENT POSITIONS:
${alignmentSummary}

DEBATE TEMPLATE:
${debateTemplate}

Write your determination in the debate template format.`,
        token
    );

    await ws.writeFile('output/phase-2-requirements-alignment.md', phase2Determination);
    stream.markdown('Phase 2 complete — requirements aligned.\n\n');

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3 — Supplemental Material Ingestion
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 3 — Ingesting supplemental context...');

    const contextFiles = await ws.readDirRecursive('context');
    let phase3Briefs = '';

    if (Object.keys(contextFiles).length === 0) {
        stream.markdown('Phase 3 skipped — no context materials in `context/`.\n\n');
    } else {
        const contextContent = Object.entries(contextFiles)
            .map(([name, content]) => `### ${name}\n\n${content}`)
            .join('\n\n---\n\n');

        const contextAgents: AgentRequest[] = agentNames.map((name) => ({
            name: formatAgentName(name),
            prompt: `You are the ${formatAgentName(name)}. Review supplemental materials through your lens.

YOUR ROLE DEFINITION:
${agentDefs[name]}

REQUIREMENTS ALIGNMENT:
${phase2Determination}

SUPPLEMENTAL MATERIALS:
${contextContent}

TASK: Extract information relevant to your review focus (under 600 words):
- Proof points, win themes, or evidence supporting the proposal
- Intelligence affecting how you'll evaluate sections
- What's missing that you'd want to see`,
        }));

        const contextOutputs = await runAgentsParallel(model, contextAgents, stream, token);
        phase3Briefs = formatAgentOutputs(contextOutputs);
        await ws.writeFile('output/phase-3-context-briefs.md', phase3Briefs);
        stream.markdown('Phase 3 complete — context briefs compiled.\n\n');
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 4 — Section-by-Section Assessment
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 4 — Section-by-section assessment...');

    const writingStandards = await resources.getWritingStandards();
    const scoreCardTemplate = await resources.getTemplate('section-score-card');
    const assessmentTemplate = await resources.getTemplate('agent-assessment');

    // Check for past performance sections
    const allAgentDefs = await resources.getAllAgentDefinitions();
    const ppDef = allAgentDefs['past-performance-specialist'];

    const allAssessments: Record<string, AgentResponse[]> = {};

    // Process each proposal section
    for (const sectionFile of proposalSections) {
        const sectionContent = proposalFiles[sectionFile];
        const sectionName = sectionFile.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
        const isPastPerformance = /past\s*performance|corporate\s*experience/i.test(sectionName);

        stream.progress(`Assessing: ${sectionName}...`);

        const sectionAgents: AgentRequest[] = agentNames.map((name) => ({
            name: formatAgentName(name),
            prompt: buildSectionAssessmentPrompt(
                agentDefs[name],
                formatAgentName(name),
                phase2Determination,
                phase3Briefs,
                scoreCardTemplate,
                writingStandards,
                sectionName,
                sectionContent
            ),
        }));

        // Add Past Performance Specialist for PP sections
        if (isPastPerformance) {
            sectionAgents.push({
                name: 'Past Performance Specialist',
                prompt: buildPPAssessmentPrompt(
                    ppDef,
                    phase2Determination,
                    phase3Briefs,
                    scoreCardTemplate,
                    sectionName,
                    sectionContent
                ),
            });
        }

        const sectionOutputs = await runAgentsParallel(model, sectionAgents, stream, token);
        allAssessments[sectionFile] = sectionOutputs;
    }

    // Write individual agent assessment reports
    for (const agentName of [...agentNames, 'past-performance-specialist']) {
        const displayName = formatAgentName(agentName);
        const agentFindings = Object.entries(allAssessments)
            .map(([section, outputs]) => {
                const finding = outputs.find((o) => o.name === displayName);
                return finding ? `### ${section}\n\n${finding.text}` : '';
            })
            .filter(Boolean)
            .join('\n\n---\n\n');

        if (agentFindings) {
            const slug = agentName;
            await ws.writeFile(`output/assessment-${slug}.md`, agentFindings);
        }
    }

    stream.markdown('Phase 4 complete — all sections assessed.\n\n');

    // ══════════════════════════════════════════════════════════════════
    // PHASE 5 — Reconciliation Debate
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 5 — Reconciliation debate...');

    // Build reconciliation summary
    const assessmentSummary = Object.entries(allAssessments)
        .map(([section, outputs]) => {
            const scores = outputs.map((o) => `${o.name}: ${extractScore(o.text)}`).join(', ');
            return `**${section}:** ${scores}`;
        })
        .join('\n');

    const reconciliationPrompt = `You are the Prop Manager conducting a reconciliation debate.

SECTION SCORES:
${assessmentSummary}

DETAILED ASSESSMENTS:
${Object.entries(allAssessments)
    .map(([section, outputs]) => `## ${section}\n\n${formatAgentOutputs(outputs)}`)
    .join('\n\n===\n\n')}

TASK:
1. Identify disagreements (where agents differ by more than one level)
2. For each disagreement, synthesize the key arguments from each side
3. Make Prop Manager determinations on all disputes
4. Assign consensus scores for every section
5. Use the debate template format

DEBATE TEMPLATE:
${debateTemplate}`;

    const reconciliation = await sendPrompt(model, reconciliationPrompt, token);
    await ws.writeFile('output/phase-5-reconciliation.md', reconciliation);
    stream.markdown('Phase 5 complete — disputes resolved.\n\n');

    // ══════════════════════════════════════════════════════════════════
    // PHASE 6 — Consolidated Reporting
    // ══════════════════════════════════════════════════════════════════
    stream.progress('Phase 6 — Generating consolidated report...');

    const consolidatedTemplate = await resources.getTemplate('consolidated-report');
    const actionTrackerTemplate = await resources.getTemplate('action-tracker');

    const reportPrompt = `You are the Prop Manager writing the final consolidated report.

PHASE 1 SUMMARY:
${phase1Summary}

RECONCILIATION RESULTS:
${reconciliation}

ALL ASSESSMENTS:
${assessmentSummary}

CONSOLIDATED REPORT TEMPLATE:
${consolidatedTemplate}

ACTION TRACKER TEMPLATE:
${actionTrackerTemplate}

TASK: Produce TWO outputs:

<!-- BEGIN CONSOLIDATED_REPORT -->
Full consolidated report following the template. Include:
- Overall H/M/L assessment
- Section score matrix
- Consensus findings
- Disputed findings with your determinations
- Evaluation criteria alignment matrix
- Critical risks
- Key recommendations
<!-- END CONSOLIDATED_REPORT -->

<!-- BEGIN ACTION_TRACKER -->
Full action tracker following the template. Include:
- All recommended actions from all agents prioritized Critical/High/Medium/Low
- Tagged to section + originating agent
- Effort estimates (S/M/L)
- Quick wins section
<!-- END ACTION_TRACKER -->`;

    stream.markdown('---\n\n### Consolidated Review Report\n\n');
    const report = await sendPromptStreaming(model, reportPrompt, stream, token);

    // Write output files
    const consolidatedReport = extractSection(report, 'CONSOLIDATED_REPORT');
    const actionTracker = extractSection(report, 'ACTION_TRACKER');

    if (consolidatedReport) {
        await ws.writeFile('output/consolidated-report.md', consolidatedReport);
    }
    if (actionTracker) {
        await ws.writeFile('output/action-tracker.md', actionTracker);
    }
    if (!consolidatedReport && !actionTracker) {
        await ws.writeFile('output/consolidated-report.md', report);
    }

    stream.markdown('\n\n---\n\n### Output Files\n\n');
    stream.markdown('- `output/consolidated-report.md`\n');
    stream.markdown('- `output/action-tracker.md`\n');
    stream.markdown('- `output/assessment-*.md` (individual agent reports)\n');
    stream.markdown('- `output/phase-*.md` (phase outputs)\n');
}

// ── Helper functions ─────────────────────────────────────────────────

function formatAgentName(slug: string): string {
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function extractScore(text: string): string {
    const match = text.match(/Confidence\s*Score:\s*\[?\s*(H|M|L|High|Medium|Low)\s*\]?/i);
    return match ? match[1].charAt(0).toUpperCase() : '?';
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

function buildAlignmentPrompt(agentDef: string, agentName: string, phase1: string): string {
    return `You are the ${agentName} on a federal proposal review panel.

YOUR ROLE DEFINITION:
${agentDef}

SOLICITATION SUMMARY:
${phase1}

TASK: Based on the solicitation summary and your role, provide (under 800 words):
1. Your top 5 requirements/evaluation priorities ranked by importance
2. Key risks you see for this proposal from your perspective
3. What you will focus on most during your section review
4. Any concerns or ambiguities in the solicitation that could affect scoring`;
}

function buildAlignmentFollowUpPrompt(
    agentDef: string,
    agentName: string,
    phase1: string,
    previousOutputs: AgentResponse[]
): string {
    const peerSummary = previousOutputs
        .filter((o) => o.name !== agentName)
        .map((o) => `**${o.name}:** ${o.text.substring(0, 500)}...`)
        .join('\n\n');

    return `You are the ${agentName} in a requirements alignment debate (Round 2+).

YOUR ROLE DEFINITION:
${agentDef}

SOLICITATION SUMMARY:
${phase1}

PEER POSITIONS:
${peerSummary}

TASK: Review your peers' positions. Revise your priorities if persuaded, or defend your position with reasoning. Address areas of disagreement. Keep under 500 words.`;
}

function buildSectionAssessmentPrompt(
    agentDef: string,
    agentName: string,
    alignment: string,
    contextBriefs: string,
    scoreCardTemplate: string,
    writingStandards: string,
    sectionName: string,
    sectionContent: string
): string {
    return `You are the ${agentName} reviewing a federal procurement proposal section.

YOUR ROLE DEFINITION:
${agentDef}

REQUIREMENTS ALIGNMENT:
${alignment}

${contextBriefs ? `YOUR CONTEXT BRIEF:\n${contextBriefs}` : ''}

SECTION SCORE CARD TEMPLATE:
${scoreCardTemplate}

WRITING STANDARDS:
${writingStandards}

PROPOSAL SECTION TO REVIEW:
Section: ${sectionName}
${sectionContent}

TASK: Review this section through your lens and produce a completed Section Score Card following the template exactly. Assign an H/M/L confidence score with justification.

Evaluate against both solicitation requirements AND Writing Standards. Flag writing standards violations (missing tool names, passive voice, unsubstantiated claims, missing PTP framework) under Weaknesses and Recommended Actions.

Be specific — cite proposal language, reference solicitation requirements, suggest concrete improvements.`;
}

function buildPPAssessmentPrompt(
    ppDef: string,
    alignment: string,
    contextBriefs: string,
    scoreCardTemplate: string,
    sectionName: string,
    sectionContent: string
): string {
    return `You are the Past Performance Specialist reviewing a federal proposal past performance section.

YOUR ROLE DEFINITION:
${ppDef}

REQUIREMENTS ALIGNMENT:
${alignment}

${contextBriefs ? `CONTEXT:\n${contextBriefs}` : ''}

SECTION SCORE CARD TEMPLATE:
${scoreCardTemplate}

PROPOSAL SECTION TO REVIEW:
Section: ${sectionName}
${sectionContent}

TASK: Review this past performance section and produce:
1. A completed Section Score Card following the template exactly
2. A relevance matrix mapping each reference to current SOW/PWS requirements
3. A coverage gap list identifying SOW areas with no or weak past performance support

Assign an H/M/L confidence score with justification. Be specific — cite reference details, identify missing quantified results, flag POC gaps, note relevance claims that are asserted but not argued.`;
}
