import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Loads bundled resource files (agent definitions, templates, writing standards)
 * from the extension's resources/ directory.
 */
export class ResourceLoader {
    private cache = new Map<string, string>();

    constructor(private extensionUri: vscode.Uri) {}

    private resourceUri(...segments: string[]): vscode.Uri {
        return vscode.Uri.joinPath(this.extensionUri, 'resources', ...segments);
    }

    private async readResource(...segments: string[]): Promise<string> {
        const key = segments.join('/');
        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }
        const uri = this.resourceUri(...segments);
        const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
        this.cache.set(key, content);
        return content;
    }

    // ── Agent Definitions ────────────────────────────────────────────

    async getAgentDefinition(agentName: string): Promise<string> {
        return this.readResource('agents', `${agentName}.md`);
    }

    async getAllAgentDefinitions(): Promise<Record<string, string>> {
        const agents = [
            'compliance-reviewer',
            'growth-strategist',
            'past-performance-specialist',
            'solution-architect',
            'subject-matter-expert',
        ];
        const entries = await Promise.all(
            agents.map(async (name) => [name, await this.getAgentDefinition(name)] as const)
        );
        return Object.fromEntries(entries);
    }

    /** The 4 core review agents (excludes past-performance-specialist) */
    async getCoreAgentDefinitions(): Promise<Record<string, string>> {
        const agents = [
            'compliance-reviewer',
            'growth-strategist',
            'solution-architect',
            'subject-matter-expert',
        ];
        const entries = await Promise.all(
            agents.map(async (name) => [name, await this.getAgentDefinition(name)] as const)
        );
        return Object.fromEntries(entries);
    }

    // ── Templates ────────────────────────────────────────────────────

    async getTemplate(templateName: string): Promise<string> {
        return this.readResource('templates', `${templateName}.md`);
    }

    async getAllTemplates(): Promise<Record<string, string>> {
        const templates = [
            'action-tracker',
            'agent-assessment',
            'blue-outline-compliance-traceability',
            'blue-outline-page-allocation',
            'blue-outline-row',
            'consolidated-report',
            'debate-round',
            'section-score-card',
        ];
        const entries = await Promise.all(
            templates.map(async (name) => [name, await this.getTemplate(name)] as const)
        );
        return Object.fromEntries(entries);
    }

    // ── Writing Standards ────────────────────────────────────────────

    async getWritingStandards(): Promise<string> {
        return this.readResource('writing-standards.md');
    }
}
