import { DbOpts } from "@wxn0brp/db-core/types/options";
import FileActions from "./action";
import vFileCpu from "./file";
export * from "./file";
export * from "./action";

export function createFileActions(folder: string, options: DbOpts = {}) {
    return new FileActions(folder, options, vFileCpu);
}