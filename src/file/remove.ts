import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { matchObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { FileCpuOpts } from "../types";
import { exists } from "../utils";
import { createRL, getDelimiter } from "./utils";

export async function remove(
	file: string,
	config: VQueryT.Remove,
	one: boolean,
	opts: FileCpuOpts,
) {
	file = pathRepair(file);

	let sourceFile = file;
	let targetFile = file;

	if (opts.journal?.isActive()) {
		const stagingPath = await opts.journal.getOrCreateStaging(file);
		sourceFile = stagingPath;
		targetFile = stagingPath;
	}

	if (!(await exists(sourceFile))) return [];

	const tmpFile = targetFile + ".tmp";
	await promises.writeFile(tmpFile, "");

	const delimiter = getDelimiter(opts);

	const rl = createRL(sourceFile, delimiter);
	const ws = createWriteStream(tmpFile, {
		flags: "a",
	});

	const removed = [];
	for await (const block of rl) {
		if (!block) continue;
		const trimmed = block.trim();

		if (one && removed.length) {
			ws.write(trimmed);
			ws.write(delimiter);
			continue;
		}
		if (!trimmed) continue;

		const data = opts.format.parse(trimmed, opts.opts);
		if (matchObj(config, data)) {
			removed.push(data);
			continue;
		}

		ws.write(trimmed);
		ws.write(delimiter);
	}

	rl.close();
	await new Promise((res, rej) => {
		ws.end((err: any) => (err ? rej(err) : res(null)));
	});

	if (opts.journal?.isActive()) {
		await promises.rename(tmpFile, targetFile);
		return removed;
	}

	await promises.rename(tmpFile, file);

	return removed;
}
