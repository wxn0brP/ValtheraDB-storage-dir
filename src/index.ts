import { DbOpts } from "@wxn0brp/db-core/types/options";
import { vFileCpu } from "./file";
import { FileActions } from "./action";
import { DbDirOpts } from "./types";
export * from "./file";
export * from "./action";

export function createFileActions(folder: string, options: DbDirOpts = {}) {
    return new FileActions(folder, options, vFileCpu);
}
