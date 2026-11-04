import { FileAdapter } from "./adapter";
import { vFileCpu } from "./file";
import { DbDirOpts } from "./types";
export * from "./adapter";
export * from "./file";
export * from "./journal";

export function createFileAdapter(folder: string, options: DbDirOpts = {}) {
	return new FileAdapter(folder, options, vFileCpu);
}

export const DYNAMIC = {
	def: createFileAdapter,
};
