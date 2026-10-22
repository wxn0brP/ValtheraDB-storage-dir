export declare function exists(path: string): Promise<boolean>;
/**
 * Removes leftover temporary files from interrupted writes.
 */
export declare function cleanupTmpFiles(folder: string): Promise<void>;
