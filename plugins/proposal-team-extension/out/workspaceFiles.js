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
exports.WorkspaceFiles = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Utilities for reading/writing workspace files used by the proposal system.
 */
class WorkspaceFiles {
    workspaceRoot;
    constructor() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            throw new Error('No workspace folder is open. Open a folder first.');
        }
        this.workspaceRoot = folders[0].uri;
    }
    // ── Path helpers ─────────────────────────────────────────────────
    uri(...segments) {
        return vscode.Uri.joinPath(this.workspaceRoot, ...segments);
    }
    // ── Existence checks ─────────────────────────────────────────────
    async exists(relativePath) {
        try {
            await vscode.workspace.fs.stat(this.uri(relativePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async dirExists(relativePath) {
        try {
            const stat = await vscode.workspace.fs.stat(this.uri(relativePath));
            return stat.type === vscode.FileType.Directory;
        }
        catch {
            return false;
        }
    }
    // ── Reading ──────────────────────────────────────────────────────
    async readFile(relativePath) {
        const data = await vscode.workspace.fs.readFile(this.uri(relativePath));
        return Buffer.from(data).toString('utf-8');
    }
    /** Read all files in a directory (non-recursive). Returns map of filename → content. */
    async readDir(relativePath) {
        const dirUri = this.uri(relativePath);
        const entries = {};
        try {
            const children = await vscode.workspace.fs.readDirectory(dirUri);
            for (const [name, type] of children) {
                if (type === vscode.FileType.File && !name.startsWith('.')) {
                    const content = await this.readFile(`${relativePath}/${name}`);
                    entries[name] = content;
                }
            }
        }
        catch {
            // Directory doesn't exist — return empty
        }
        return entries;
    }
    /** Read all files in a directory recursively. Returns map of relative-path → content. */
    async readDirRecursive(relativePath) {
        const entries = {};
        const walk = async (dir) => {
            const dirUri = this.uri(dir);
            try {
                const children = await vscode.workspace.fs.readDirectory(dirUri);
                for (const [name, type] of children) {
                    const childPath = `${dir}/${name}`;
                    if (type === vscode.FileType.File && !name.startsWith('.')) {
                        entries[childPath] = await this.readFile(childPath);
                    }
                    else if (type === vscode.FileType.Directory) {
                        await walk(childPath);
                    }
                }
            }
            catch {
                // skip
            }
        };
        await walk(relativePath);
        return entries;
    }
    // ── Writing ──────────────────────────────────────────────────────
    async writeFile(relativePath, content) {
        const fileUri = this.uri(relativePath);
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
    }
    async createDirectory(relativePath) {
        await vscode.workspace.fs.createDirectory(this.uri(relativePath));
    }
    /** Create a directory tree. Accepts paths like 'context/extracted'. */
    async createDirectories(paths) {
        for (const p of paths) {
            await this.createDirectory(p);
        }
    }
    // ── Listing ──────────────────────────────────────────────────────
    async listFiles(relativePath) {
        try {
            const children = await vscode.workspace.fs.readDirectory(this.uri(relativePath));
            return children
                .filter(([name, type]) => type === vscode.FileType.File && !name.startsWith('.'))
                .map(([name]) => name);
        }
        catch {
            return [];
        }
    }
    async listDirs(relativePath) {
        try {
            const children = await vscode.workspace.fs.readDirectory(this.uri(relativePath));
            return children
                .filter(([, type]) => type === vscode.FileType.Directory)
                .map(([name]) => name);
        }
        catch {
            return [];
        }
    }
    // ── Copy ─────────────────────────────────────────────────────────
    async copyFile(from, to) {
        await vscode.workspace.fs.copy(this.uri(from), this.uri(to), { overwrite: false });
    }
}
exports.WorkspaceFiles = WorkspaceFiles;
//# sourceMappingURL=workspaceFiles.js.map