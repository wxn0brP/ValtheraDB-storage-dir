import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { FileCpuOpts } from "./types.js";
export declare class FileActionsUtils {
    getLastFile(path: string, maxFileSize: number, query: VQuery, opts?: FileCpuOpts): Promise<string>;
    getSortedFiles(folder: string, query: VQuery, opts?: FileCpuOpts): Promise<string[]>;
    operationUpdater(c_path: string, worker: (file: string, config: VQuery, one: boolean, opts: FileCpuOpts) => Promise<DataInternal[]>, one: boolean, config: VQuery, opts: FileCpuOpts): Promise<DataInternal[]>;
}
