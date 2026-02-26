import * as vscode from 'vscode';

/**
 * Utilities for interacting with VS Code's Language Model API.
 * Wraps model selection, message construction, and request execution.
 */

export interface AgentRequest {
    /** Display name for progress reporting */
    name: string;
    /** The full prompt to send */
    prompt: string;
}

export interface AgentResponse {
    name: string;
    text: string;
}

/**
 * Select the best available language model.
 */
export async function selectModel(): Promise<vscode.LanguageModelChat> {
    const models = await vscode.lm.selectChatModels();
    if (models.length === 0) {
        throw new Error(
            'No language models available. Make sure you have a Copilot subscription or another LM provider configured.'
        );
    }
    // Prefer models with larger token limits
    models.sort((a, b) => (b.maxInputTokens ?? 0) - (a.maxInputTokens ?? 0));
    return models[0];
}

/**
 * Send a prompt to the language model and collect the full response text.
 */
export async function sendPrompt(
    model: vscode.LanguageModelChat,
    prompt: string,
    token: vscode.CancellationToken
): Promise<string> {
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
export async function sendPromptStreaming(
    model: vscode.LanguageModelChat,
    prompt: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
): Promise<string> {
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
export async function runAgentsParallel(
    model: vscode.LanguageModelChat,
    agents: AgentRequest[],
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
): Promise<AgentResponse[]> {
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
export async function runDebate(
    model: vscode.LanguageModelChat,
    rounds: number,
    buildPrompts: (round: number, previousOutputs?: AgentResponse[]) => AgentRequest[],
    convergenceTest: (outputs: AgentResponse[]) => boolean,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
): Promise<{ rounds: AgentResponse[][]; converged: boolean }> {
    const allRounds: AgentResponse[][] = [];
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
export function formatAgentOutputs(outputs: AgentResponse[]): string {
    return outputs
        .map((o) => `## ${o.name}\n\n${o.text}`)
        .join('\n\n---\n\n');
}
