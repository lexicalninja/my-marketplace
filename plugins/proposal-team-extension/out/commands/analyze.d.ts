import * as vscode from 'vscode';
import { ResourceLoader } from '../resourceLoader';
/**
 * /analyze — Solicitation analysis.
 * 5-phase workflow: Ingest → Extract → Interpret → Write → Report.
 */
export declare function handleAnalyze(request: vscode.ChatRequest, stream: vscode.ChatResponseStream, token: vscode.CancellationToken, resources: ResourceLoader): Promise<void>;
//# sourceMappingURL=analyze.d.ts.map