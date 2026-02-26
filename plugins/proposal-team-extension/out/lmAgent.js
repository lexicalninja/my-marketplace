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
exports.selectModel = selectModel;
exports.sendPrompt = sendPrompt;
exports.sendPromptStreaming = sendPromptStreaming;
exports.runAgentsParallel = runAgentsParallel;
exports.runDebate = runDebate;
exports.formatAgentOutputs = formatAgentOutputs;
const vscode = __importStar(require("vscode"));
/**
 * Select the best available language model.
 */
async function selectModel() {
    const models = await vscode.lm.selectChatModels();
    if (models.length === 0) {
        throw new Error('No language models available. Make sure you have a Copilot subscription or another LM provider configured.');
    }
    // Prefer models with larger token limits
    models.sort((a, b) => (b.maxInputTokens ?? 0) - (a.maxInputTokens ?? 0));
    return models[0];
}
/**
 * Send a prompt to the language model and collect the full response text.
 */
async function sendPrompt(model, prompt, token) {
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    const response = await model.sendRequest(messages, {}, token);
    let result = '';
    for await (const chunk of response.text) {
        result += chunk;
    }
    return result;
}
/**
 * Send a prompt to the language model and stream the response to a chat stream.
 */
async function sendPromptStreaming(model, prompt, stream, token) {
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    const response = await model.sendRequest(messages, {}, token);
    let result = '';
    for await (const chunk of response.text) {
        result += chunk;
        stream.markdown(chunk);
    }
    return result;
}
/**
 * Run multiple agent prompts in parallel and collect results.
 * Shows progress for each agent as it completes.
 */
async function runAgentsParallel(model, agents, stream, token) {
    stream.progress(`Running ${agents.length} agents in parallel...`);
    const promises = agents.map(async (agent) => {
        const text = await sendPrompt(model, agent.prompt, token);
        stream.progress(`${agent.name} complete`);
        return { name: agent.name, text };
    });
    return Promise.all(promises);
}
/**
 * Run a multi-round debate between agents.
 * Returns the final round's outputs.
 */
async function runDebate(model, rounds, buildPrompts, convergenceTest, stream, token) {
    const allRounds = [];
    let converged = false;
    for (let round = 1; round <= rounds; round++) {
        stream.progress(`Debate round ${round}/${rounds}...`);
        const prompts = buildPrompts(round, allRounds[allRounds.length - 1]);
        const outputs = await runAgentsParallel(model, prompts, stream, token);
        allRounds.push(outputs);
        converged = convergenceTest(outputs);
        if (converged) {
            stream.progress(`Consensus reached after round ${round}`);
            break;
        }
    }
    return { rounds: allRounds, converged };
}
/**
 * Format agent responses into a readable summary for passing to subsequent prompts.
 */
function formatAgentOutputs(outputs) {
    return outputs
        .map((o) => `## ${o.name}\n\n${o.text}`)
        .join('\n\n---\n\n');
}
//# sourceMappingURL=lmAgent.js.map