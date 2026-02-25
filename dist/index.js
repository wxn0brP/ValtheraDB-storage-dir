import { vFileCpu } from "./file/index.js";
import { FileActions } from "./action.js";
export * from "./file/index.js";
export * from "./action.js";
export function createFileActions(folder, options = {}) {
    return new FileActions(folder, options, vFileCpu);
}
