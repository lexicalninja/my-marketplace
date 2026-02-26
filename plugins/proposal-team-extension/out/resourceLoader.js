"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceLoader = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Loads bundled resource files (agent definitions, templates, writing standards)
 * from the extension's resources/ directory.
 */
class ResourceLoader {
    extensionUri;
    cache = new Map();
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resourceUri(...segments) {
        return vscode.Uri.joinPath(this.extensionUri, 'resources', ...segments);
    }
    async readResource(...segments) {
        const key = segments.join('/');
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const uri = this.resourceUri(...segments);
        const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
        this.cache.set(key, content);
        return content;
    }
    // ── Agent Definitions ────────────────────────────────────────────
    async getAgentDefinition(agentName) {
        return this.readResource('agents', `${agentName}.md`);
    }
    async getAllAgentDefinitions() {
        const agents = [
            'compliance-reviewer',
            'growth-strategist',
            'past-performance-specialist',
            'solution-architect',
            'subject-matter-expert',
        ];
        const entries = await Promise.all(agents.map(async (name) => [name, await this.getAgentDefinition(name)]));
        return Object.fromEntries(entries);
    }
    /** The 4 core review agents (excludes past-performance-specialist) */
    async getCoreAgentDefinitions() {
        const agents = [
            'compliance-reviewer',
            'growth-strategist',
            'solution-architect',
            'subject-matter-expert',
        ];
        const entries = await Promise.all(agents.map(async (name) => [name, await this.getAgentDefinition(name)]));
        return Object.fromEntries(entries);
    }
    // ── Templates ────────────────────────────────────────────────────
    async getTemplate(templateName) {
        return this.readResource('templates', `${templateName}.md`);
    }
    async getAllTemplates() {
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
        const entries = await Promise.all(templates.map(async (name) => [name, await this.getTemplate(name)]));
        return Object.fromEntries(entries);
    }
    // ── Writing Standards ────────────────────────────────────────────
    async getWritingStandards() {
        return this.readResource('writing-standards.md');
    }
}
exports.ResourceLoader = ResourceLoader;
//# sourceMappingURL=resourceLoader.js.map