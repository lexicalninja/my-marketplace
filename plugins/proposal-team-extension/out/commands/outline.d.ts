import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /outline — Create a Blue Outline.
 * 4-phase workflow: Ingest → Framework → Agent Content → Compile.
 */
export declare function handleOutline(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=outline.d.ts.map