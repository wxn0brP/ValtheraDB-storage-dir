import { FileActions } from "./action.js";
import { DbDirOpts } from "./types.js";
export * from "./action.js";
export * from "./file/index.js";
export declare function createFileAdapter(folder: string, options?: DbDirOpts): FileActions;
/**
 * @deprecated Use {@link createFileAdapter}
 */
export declare const createFileActions: typeof createFileAdapter;
export declare const DYNAMIC: {
    dir: typeof createFileAdapter;
};
