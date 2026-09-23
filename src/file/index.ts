import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { appendFile } from "fs/promises";
import { FileCpuOpts } from "../types";
import { find, findOne } from "./find";
import { remove } from "./remove";
import { update } from "./update";
import { getDelimiter } from "./utils";

export const vFileCpu: FileCpu = {
	add: async (file: string, config: VQueryT.Add, opts: FileCpuOpts) => {
		const dataString = opts.format.stringify(config.data, opts);
		const content = dataString + getDelimiter(opts);
		if (opts.journal?.isActive()) {
			const stagingPath = await opts.journal.getOrCreateStaging(file);
			await appendFile(stagingPath, content);
			return;
		}
		await appendFile(file, content);
	},
	find,
	findOne,
	update,
	remove,
};
