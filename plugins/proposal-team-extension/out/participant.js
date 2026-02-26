"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalTeamParticipant = void 0;
const vscode = __importStar(require("vscode"));
const resourceLoader_1 = require("./resourceLoader");
const setup_1 = require("./commands/setup");
const analyze_1 = require("./commands/analyze");
const outline_1 = require("./commands/outline");
const draft_1 = require("./commands/draft");
const review_1 = require("./commands/review");
const run_1 = require("./commands/run");
const lmAgent_1 = require("./lmAgent");
const PARTICIPANT_ID = 'proposal-team.participant';
class ProposalTeamParticipant {
    context;
    resources;
    constructor(context) {
        this.context = context;
        this.resources = new resourceLoader_1.ResourceLoader(context.extensionUri);
    }
    register() {
        const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, this.handleRequest.bind(this));
        participant.iconPath = new vscode.ThemeIcon('organization');
        return participant;
    }
    async handleRequest(request, context, stream, token) {
        try {
            switch (request.command) {
                case 'setup':
                    await (0, setup_1.handleSetup)(request, stream, token, this.resources);
                    break;
                case 'analyze':
                    await (0, analyze_1.handleAnalyze)(request, stream, token, this.resources);
                    break;
                case 'outline':
                    await (0, outline_1.handleOutline)(request, stream, token, this.resources);
                    break;
                case 'draft':
                    await (0, draft_1.handleDraft)(request, stream, token, this.resources);
                    break;
                case 'review':
                    await (0, review_1.handleReview)(request, stream, token, this.resources);
                    break;
                case 'run':
                    await (0, run_1.handleRun)(request, stream, token, this.resources);
                    break;
                default:
                    await this.handleGeneralQuestion(request, stream, token);
                    break;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                stream.markdown(`\n\n### ⚠ Error\n\n${error.message}\n`);
                if (error.message.includes('No workspace folder')) {
                    stream.markdown('\nOpen a workspace folder first, then try again.\n');
                }
                if (error.message.includes('No language models')) {
                    stream.markdown('\nMake sure you have GitHub Copilot or another LM provider active.\n');
                }
            }
            else {
                stream.markdown('\n\n### ⚠ Unexpected Error\n\nSomething went wrong. Please try again.\n');
            }
        }
    }
    /**
     * Handle general questions without a specific slash command.
     * Provides proposal-related guidance with context from the workspace.
     */
    async handleGeneralQuestion(request, stream, token) {
        const model = await (0, lmAgent_1.selectModel)();
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
        await (0, lmAgent_1.sendPromptStreaming)(model, prompt, stream, token);
    }
}
exports.ProposalTeamParticipant = ProposalTeamParticipant;
//# sourceMappingURL=participant.js.map