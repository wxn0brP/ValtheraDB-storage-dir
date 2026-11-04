import { FileAdapter } from "./adapter.js";
import { DbDirOpts } from "./types.js";
export * from "./adapter.js";
export * from "./file/index.js";
export * from "./journal.js";
export declare function createFileAdapter(folder: string, options?: DbDirOpts): FileAdapter;
export declare const DYNAMIC: {
    def: typeof createFileAdapter;
};
