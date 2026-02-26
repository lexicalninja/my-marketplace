import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /run — End-to-end proposal workflow with checkpoints.
 * Orchestrates: analyze → outline → draft → review.
 *
 * Since VS Code chat doesn't support multi-turn interactive checkpoints,
 * this command checks existing state and runs the next pending phase.
 * The user re-invokes /run to advance through phases.
 */
export declare function handleRun(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=run.d.ts.map