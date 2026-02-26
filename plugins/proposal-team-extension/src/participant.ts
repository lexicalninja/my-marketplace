import * as vscode from 'vscode';
import { ResourceLoader } from './resourceLoader';
import { handleSetup } from './commands/setup';
import { handleAnalyze } from './commands/analyze';
import { handleOutline } from './commands/outline';
import { handleDraft } from './commands/draft';
import { handleReview } from './commands/review';
import { handleRun } from './commands/run';
import { selectModel, sendPromptStreaming } from './lmAgent';

const PARTICIPANT_ID = 'proposal-team.participant';

export class ProposalTeamParticipant {
    private resources: ResourceLoader;

    constructor(private context: vscode.ExtensionContext) {
        this.resources = new ResourceLoader(context.extensionUri);
    }

    register(): vscode.Disposable {
        const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, this.handleRequest.bind(this));

        participant.iconPath = new vscode.ThemeIcon('organization');

        return participant;
    }

    private async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        try {
            switch (request.command) {
                case 'setup':
                    await handleSetup(request, stream, token, this.resources);
                    break;

                case 'analyze':
                    await handleAnalyze(request, stream, token, this.resources);
                    break;

                case 'outline':
                    await handleOutline(request, stream, token, this.resources);
                    break;

                case 'draft':
                    await handleDraft(request, stream, token, this.resources);
                    break;

                case 'review':
                    await handleReview(request, stream, token, this.resources);
                    break;

                case 'run':
                    await handleRun(request, stream, token, this.resources);
                    break;

                default:
                    await this.handleGeneralQuestion(request, stream, token);
                    break;
            }
        } catch (error) {
            if (error instanceof Error) {
                stream.markdown(`\n\n### ⚠ Error\n\n${error.message}\n`);
                if (error.message.includes('No workspace folder')) {
                    stream.markdown('\nOpen a workspace folder first, then try again.\n');
                }
                if (error.message.includes('No language models')) {
                    stream.markdown('\nMake sure you have GitHub Copilot or another LM provider active.\n');
                }
            } else {
                stream.markdown('\n\n### ⚠ Unexpected Error\n\nSomething went wrong. Please try again.\n');
            }
        }
    }

    /**
     * Handle general questions without a specific slash command.
     * Provides proposal-related guidance with context from the workspace.
     */
    private async handleGeneralQuestion(
        request: vscode.ChatRequest,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const model = await selectModel();
        const writingStandards = await this.resources.getWritingStandards();

        const prompt = `You are a federal proposal development expert — the Prop Manager of a multi-agent proposal team.

You help with federal procurement proposals: solicitation analysis, compliance, win strategy, technical writing, and review.

Your team includes:
- **Growth Strategist** — win themes, discriminators, competitive positioning
- **Solution Architect** — solution coherence, staffing, technology alignment
- **Subject Matter Expert** — technical correctness, methodology, feasibility
- **Compliance Reviewer** — requirements coverage, Section L/M traceability, format
- **Past Performance Specialist** — relevance, STAR narratives, CPARS context

Available commands:
- \`/setup\` — initialize project directory structure
- \`/analyze\` — analyze a solicitation
- \`/outline\` — create a Blue Outline (section writing instructions)
- \`/draft\` — draft proposal sections
- \`/review\` — run multi-agent proposal review
- \`/run\` — full end-to-end workflow with checkpoints

WRITING STANDARDS REFERENCE:
${writingStandards}

USER QUESTION:
${request.prompt}

Provide a helpful, concise response. If the question relates to a specific workflow step, suggest the appropriate command.`;

        await sendPromptStreaming(model, prompt, stream, token);
    }
}
