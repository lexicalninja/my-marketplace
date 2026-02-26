import * as vscode from 'vscode';
/**
 * Utilities for reading/writing workspace files used by the proposal system.
 */
export declare class WorkspaceFiles {
    private workspaceRoot;
    constructor();
    uri(...segments: string[]): vscode.Uri;
    exists(relativePath: string): Promise<boolean>;
    dirExists(relativePath: string): Promise<boolean>;
    readFile(relativePath: string): Promise<string>;
    /** Read all files in a directory (non-recursive). Returns map of filename → content. */
    readDir(relativePath: string): Promise<Record<string, string>>;
    /** Read all files in a directory recursively. Returns map of relative-path → content. */
    readDirRecursive(relativePath: string): Promise<Record<string, string>>;
    writeFile(relativePath: string, content: string): Promise<void>;
    createDirectory(relativePath: string): Promise<void>;
    /** Create a directory tree. Accepts paths like 'context/extracted'. */
    createDirectories(paths: string[]): Promise<void>;
    listFiles(relativePath: string): Promise<string[]>;
    listDirs(relativePath: string): Promise<string[]>;
    copyFile(from: string, to: string): Promise<void>;
}
//# sourceMappingURL=workspaceFiles.d.ts.map