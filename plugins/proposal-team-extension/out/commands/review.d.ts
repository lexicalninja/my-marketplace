import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /review — Multi-agent proposal review.
 * 6-phase workflow: Ingest → Alignment Debate → Context → Assessment → Reconciliation → Report.
 */
export declare function handleReview(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=review.d.ts.map