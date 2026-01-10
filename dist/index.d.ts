import { DbOpts } from "@wxn0brp/db-core/types/options";
import FileActions from "./action.js";
export * from "./file/index.js";
export * from "./action.js";
export declare function createFileActions(folder: string, options?: DbOpts): FileActions;
