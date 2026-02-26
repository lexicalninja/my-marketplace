import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /setup — One-time project setup.
 * Creates directories, copies templates, and creates a CLAUDE.md overview.
 */
export declare function handleSetup(_request: vscode.ChatRequest, stream: vscode.ChatResponseStream, _token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=setup.d.ts.map