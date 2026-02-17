import { FileActions } from "./action.js";
import { DbDirOpts } from "./types.js";
export * from "./file/index.js";
export * from "./action.js";
export declare function createFileActions(folder: string, options?: DbDirOpts): FileActions;
