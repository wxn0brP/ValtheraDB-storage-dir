import { DbOpts } from "@wxn0brp/db-core/types/options";
import { vFileCpu } from "./file";
import { FileActions } from "./action";
export * from "./file";
export * from "./action";

export function createFileActions(folder: string, options: DbOpts = {}) {
    return new FileActions(folder, options, vFileCpu);
}