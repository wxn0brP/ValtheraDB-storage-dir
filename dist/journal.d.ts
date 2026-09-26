/**
 * Transaction workspace for file-based database.
 * Instead of buffering operations, maintains working copies of modified files.
 * All staging happens in a single `.tx/` directory for easy cleanup.
 */
export declare class DirJournal {
    private active;
    private poisoned;
    private files;
    private mkdirs;
    private txDir;
    constructor(folder: string);
    begin(): void;
    /**
     * Get or create staging path for a file.
     * First call copies original to staging, subsequent calls return existing staging.
     */
    getOrCreateStaging(originalPath: string): Promise<string>;
    /**
     * Get staging path if it exists, null otherwise.
     */
    getStagingPath(originalPath: string): string;
    /**
     * Get all staged files for a given folder.
     * Returns array of original filenames (not staging paths).
     */
    getStagedFiles(folder: string): string[];
    /**
     * Buffer a mkdir operation.
     */
    bufferMkdir(path: string): void;
    /**
     * Check if a path has been buffered for mkdir.
     */
    hasMkdir(path: string): boolean;
    /**
     * Commit: create all directories, then rename all staging files.
     * On error: cleanup remaining staging files and poison the journal.
     */
    commit(): Promise<void>;
    /**
     * Rollback: remove all staging files and directories.
     */
    rollback(): Promise<void>;
    /**
     * Remove all staging files (public for cleanup from init).
     */
    cleanupStaging(): Promise<void>;
    isActive(): boolean;
    isPoisoned(): boolean;
    /**
     * Reset poisoned state (for testing or recovery).
     */
    resetPoisoned(): void;
}
