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
export declare function selectModel(): Promise<vscode.LanguageModelChat>;
/**
 * Send a prompt to the language model and collect the full response text.
 */
export declare function sendPrompt(model: vscode.LanguageModelChat, prompt: string, token: vscode.CancellationToken): Promise<string>;
/**
 * Send a prompt to the language model and stream the response to a chat stream.
 */
export declare function sendPromptStreaming(model: vscode.LanguageModelChat, prompt: string, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<string>;
/**
 * Run multiple agent prompts in parallel and collect results.
 * Shows progress for each agent as it completes.
 */
export declare function runAgentsParallel(model: vscode.LanguageModelChat, agents: AgentRequest[], stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<AgentResponse[]>;
/**
 * Run a multi-round debate between agents.
 * Returns the final round's outputs.
 */
export declare function runDebate(model: vscode.LanguageModelChat, rounds: number, buildPrompts: (round: number, previousOutputs?: AgentResponse[]) => AgentRequest[], convergenceTest: (outputs: AgentResponse[]) => boolean, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<{
    rounds: AgentResponse[][];
    converged: boolean;
}>;
/**
 * Format agent responses into a readable summary for passing to subsequent prompts.
 */
export declare function formatAgentOutputs(outputs: AgentResponse[]): string;
//# sourceMappingURL=lmAgent.d.ts.map