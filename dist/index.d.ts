import { FileActions } from "./action.js";
import { DbDirOpts } from "./types.js";
export * from "./action.js";
export * from "./file/index.js";
export declare function createFileActions(folder: string, options?: DbDirOpts): FileActions;
