import { FileAdapter } from "./adapter.js";
import { vFileCpu } from "./file/index.js";
export * from "./adapter.js";
export * from "./file/index.js";
export * from "./journal.js";
export function createFileAdapter(folder, options = {}) {
    return new FileAdapter(folder, options, vFileCpu);
}
export const DYNAMIC = {
    def: createFileAdapter,
};
