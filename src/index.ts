import { FileActions } from "./action";
import { vFileCpu } from "./file";
import { DbDirOpts } from "./types";
export * from "./action";
export * from "./file";

export function createFileActions(folder: string, options: DbDirOpts = {}) {
    return new FileActions(folder, options, vFileCpu);
}
