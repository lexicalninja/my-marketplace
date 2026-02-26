import * as vscode from 'vscode';
export declare class ProposalTeamParticipant {
    private context;
    private resources;
    constructor(context: vscode.ExtensionContext);
    register(): vscode.Disposable;
    private handleRequest;
    /**
     * Handle general questions without a specific slash command.
     * Provides proposal-related guidance with context from the workspace.
     */
    private handleGeneralQuestion;
}
//# sourceMappingURL=participant.d.ts.map