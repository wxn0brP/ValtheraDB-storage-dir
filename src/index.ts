import { FileActions } from "./action";
import { vFileCpu } from "./file";
import { DbDirOpts } from "./types";
export * from "./action";
export * from "./file";

export function createFileAdapter(folder: string, options: DbDirOpts = {}) {
	return new FileActions(folder, options, vFileCpu);
}

/**
 * @deprecated Use {@link createFileAdapter}
 */
export const createFileActions = createFileAdapter;

export const DYNAMIC = {
	dir: createFileAdapter,
};
