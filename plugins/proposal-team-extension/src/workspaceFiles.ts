import * as vscode from 'vscode';

/**
 * Utilities for reading/writing workspace files used by the proposal system.
 */
export class WorkspaceFiles {
    private workspaceRoot: vscode.Uri;

    constructor() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            throw new Error('No workspace folder is open. Open a folder first.');
        }
        this.workspaceRoot = folders[0].uri;
    }

    // ── Path helpers ─────────────────────────────────────────────────

    uri(...segments: string[]): vscode.Uri {
        return vscode.Uri.joinPath(this.workspaceRoot, ...segments);
    }

    // ── Existence checks ─────────────────────────────────────────────

    async exists(relativePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(this.uri(relativePath));
            return true;
        } catch {
            return false;
        }
    }

    async dirExists(relativePath: string): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(this.uri(relativePath));
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    // ── Reading ──────────────────────────────────────────────────────

    async readFile(relativePath: string): Promise<string> {
        const data = await vscode.workspace.fs.readFile(this.uri(relativePath));
        return Buffer.from(data).toString('utf-8');
    }

    /** Read all files in a directory (non-recursive). Returns map of filename → content. */
    async readDir(relativePath: string): Promise<Record<string, string>> {
        const dirUri = this.uri(relativePath);
        const entries: Record<string, string> = {};
        try {
            const children = await vscode.workspace.fs.readDirectory(dirUri);
            for (const [name, type] of children) {
                if (type === vscode.FileType.File && !name.startsWith('.')) {
                    const content = await this.readFile(`${relativePath}/${name}`);
                    entries[name] = content;
                }
            }
        } catch {
            // Directory doesn't exist — return empty
        }
        return entries;
    }

    /** Read all files in a directory recursively. Returns map of relative-path → content. */
    async readDirRecursive(relativePath: string): Promise<Record<string, string>> {
        const entries: Record<string, string> = {};
        const walk = async (dir: string) => {
            const dirUri = this.uri(dir);
            try {
                const children = await vscode.workspace.fs.readDirectory(dirUri);
                for (const [name, type] of children) {
                    const childPath = `${dir}/${name}`;
                    if (type === vscode.FileType.File && !name.startsWith('.')) {
                        entries[childPath] = await this.readFile(childPath);
                    } else if (type === vscode.FileType.Directory) {
                        await walk(childPath);
                    }
                }
            } catch {
                // skip
            }
        };
        await walk(relativePath);
        return entries;
    }

    // ── Writing ──────────────────────────────────────────────────────

    async writeFile(relativePath: string, content: string): Promise<void> {
        const fileUri = this.uri(relativePath);
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));
    }

    async createDirectory(relativePath: string): Promise<void> {
        await vscode.workspace.fs.createDirectory(this.uri(relativePath));
    }

    /** Create a directory tree. Accepts paths like 'context/extracted'. */
    async createDirectories(paths: string[]): Promise<void> {
        for (const p of paths) {
            await this.createDirectory(p);
        }
    }

    // ── Listing ──────────────────────────────────────────────────────

    async listFiles(relativePath: string): Promise<string[]> {
        try {
            const children = await vscode.workspace.fs.readDirectory(this.uri(relativePath));
            return children
                .filter(([name, type]) => type === vscode.FileType.File && !name.startsWith('.'))
                .map(([name]) => name);
        } catch {
            return [];
        }
    }

    async listDirs(relativePath: string): Promise<string[]> {
        try {
            const children = await vscode.workspace.fs.readDirectory(this.uri(relativePath));
            return children
                .filter(([, type]) => type === vscode.FileType.Directory)
                .map(([name]) => name);
        } catch {
            return [];
        }
    }

    // ── Copy ─────────────────────────────────────────────────────────

    async copyFile(from: string, to: string): Promise<void> {
        await vscode.workspace.fs.copy(this.uri(from), this.uri(to), { overwrite: false });
    }
}
