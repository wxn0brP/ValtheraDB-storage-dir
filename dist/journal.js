import { promises } from "fs";
import { join } from "path";
/**
 * Transaction workspace for file-based database.
 * Instead of buffering operations, maintains working copies of modified files.
 * All staging happens in a single `.tx/` directory for easy cleanup.
 */
export class DirJournal {
    active = false;
    poisoned = false;
    // original path -> staging path
    files = new Map();
    mkdirs = new Set();
    txDir;
    constructor(folder) {
        this.txDir = join(folder, ".tx");
    }
    begin() {
        if (this.poisoned) {
            throw new Error("journal is poisoned, cannot begin new transaction");
        }
        this.active = true;
        this.files.clear();
        this.mkdirs.clear();
    }
    /**
     * Get or create staging path for a file.
     * First call copies original to staging, subsequent calls return existing staging.
     */
    async getOrCreateStaging(originalPath) {
        if (!this.active) {
            throw new Error("journal not active");
        }
        const existing = this.files.get(originalPath);
        if (existing)
            return existing;
        await promises.mkdir(this.txDir, {
            recursive: true,
        });
        const basename = originalPath.replace(/[/\\]/g, "_");
        const stagingPath = join(this.txDir, `${basename}.staging`);
        try {
            await promises.copyFile(originalPath, stagingPath);
        }
        catch {
            await promises.writeFile(stagingPath, "");
        }
        this.files.set(originalPath, stagingPath);
        return stagingPath;
    }
    /**
     * Get staging path if it exists, null otherwise.
     */
    getStagingPath(originalPath) {
        return this.files.get(originalPath) || null;
    }
    /**
     * Get all staged files for a given folder.
     * Returns array of original filenames (not staging paths).
     */
    getStagedFiles(folder) {
        if (!this.active)
            return [];
        const stagedFiles = [];
        for (const originalPath of this.files.keys()) {
            if (originalPath.startsWith(folder)) {
                const filename = originalPath.slice(folder.length);
                if (filename && !filename.includes("/")) {
                    stagedFiles.push(filename);
                }
            }
        }
        return stagedFiles;
    }
    /**
     * Buffer a mkdir operation.
     */
    bufferMkdir(path) {
        if (!this.active)
            return;
        this.mkdirs.add(path);
    }
    /**
     * Check if a path has been buffered for mkdir.
     */
    hasMkdir(path) {
        return this.mkdirs.has(path);
    }
    /**
     * Commit: create all directories, then rename all staging files.
     * On error: cleanup remaining staging files and poison the journal.
     */
    async commit() {
        if (!this.active)
            return;
        try {
            for (const dir of this.mkdirs) {
                await promises.mkdir(dir, {
                    recursive: true,
                });
            }
            const renames = [];
            for (const [original, staging] of this.files) {
                renames.push([
                    staging,
                    original,
                ]);
            }
            for (const [staging, original] of renames) {
                await promises.rename(staging, original);
            }
            this.files.clear();
            this.mkdirs.clear();
            this.active = false;
        }
        catch (err) {
            await this.cleanupStaging();
            this.files.clear();
            this.mkdirs.clear();
            this.active = false;
            this.poisoned = true;
            throw err;
        }
    }
    /**
     * Rollback: remove all staging files and directories.
     */
    async rollback() {
        if (!this.active)
            return;
        await this.cleanupStaging();
        for (const dir of this.mkdirs) {
            try {
                await promises.rmdir(dir);
            }
            catch {
                // Directory not empty or doesn't exist, ignore
            }
        }
        this.files.clear();
        this.mkdirs.clear();
        this.active = false;
    }
    /**
     * Remove all staging files (public for cleanup from init).
     */
    async cleanupStaging() {
        try {
            await promises.rm(this.txDir, {
                recursive: true,
                force: true,
            });
        }
        catch {
            // Ignore cleanup errors
        }
    }
    isActive() {
        return this.active;
    }
    isPoisoned() {
        return this.poisoned;
    }
    /**
     * Reset poisoned state (for testing or recovery).
     */
    resetPoisoned() {
        this.poisoned = false;
    }
}
