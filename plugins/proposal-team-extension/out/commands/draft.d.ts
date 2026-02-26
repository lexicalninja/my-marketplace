import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /draft — Draft one or more proposal sections.
 * 4-phase workflow: Identify → Load Context → Draft → Output.
 */
export declare function handleDraft(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=draft.d.ts.map