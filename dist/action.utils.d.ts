import { VQuery } from "@wxn0brp/db-core/types/query";
import { DataInternal } from "@wxn0brp/db-core/types/data";
export declare class FileActionsUtils {
    /**
     * Get the last file in the specified directory.
     */
    getLastFile(path: string, maxFileSize: number, query: VQuery): Promise<string>;
    /**
     * Get all files in a directory sorted by name.
     */
    getSortedFiles(folder: string, query: VQuery): Promise<string[]>;
    operationUpdater(c_path: string, worker: (file: string, config: VQuery, one: boolean) => Promise<boolean>, one: boolean, config: VQuery): Promise<DataInternal[]>;
}
