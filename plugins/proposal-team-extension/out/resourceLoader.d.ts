import * as vscode from 'vscode';
/**
 * Loads bundled resource files (agent definitions, templates, writing standards)
 * from the extension's resources/ directory.
 */
export declare class ResourceLoader {
    private extensionUri;
    private cache;
    constructor(extensionUri: vscode.Uri);
    private resourceUri;
    private readResource;
    getAgentDefinition(agentName: string): Promise<string>;
    getAllAgentDefinitions(): Promise<Record<string, string>>;
    /** The 4 core review agents (excludes past-performance-specialist) */
    getCoreAgentDefinitions(): Promise<Record<string, string>>;
    getTemplate(templateName: string): Promise<string>;
    getAllTemplates(): Promise<Record<string, string>>;
    getWritingStandards(): Promise<string>;
}
//# sourceMappingURL=resourceLoader.d.ts.map