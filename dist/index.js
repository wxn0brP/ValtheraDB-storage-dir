import { FileActions } from "./action.js";
import { vFileCpu } from "./file/index.js";
export * from "./action.js";
export * from "./file/index.js";
export function createFileAdapter(folder, options = {}) {
    return new FileActions(folder, options, vFileCpu);
}
/**
 * @deprecated Use {@link createFileAdapter}
 */
export const createFileActions = createFileAdapter;
export const DYNAMIC = {
    dir: createFileAdapter,
};
