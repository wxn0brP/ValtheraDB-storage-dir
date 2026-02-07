export declare class FileActionsUtils {
    /**
     * Get the last file in the specified directory.
     */
    getLastFile(path: string, maxFileSize: number): Promise<string>;
    /**
     * Get all files in a directory sorted by name.
     */
    getSortedFiles(folder: string): Promise<string[]>;
    operationUpdater(c_path: string, worker: (file: string, one: boolean, ...args: any[]) => Promise<boolean>, one: boolean, ...args: any[]): Promise<boolean>;
}
