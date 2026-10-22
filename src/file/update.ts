import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { matchObj, updateObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { FileCpuOpts } from "../types";
import { exists } from "../utils";
import { createRL, getDelimiter } from "./utils";

export async function update(
	file: string,
	config: VQueryT.Update,
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

	const updated = [];
	try {
		for await (const block of rl) {
			const trimmed = block.trim();

			if (!trimmed) {
				ws.write(block);
				ws.write(delimiter);
				continue;
			}

			if (one && updated.length) {
				ws.write(block);
				ws.write(delimiter);
				continue;
			}

			let out = block;
			const data = opts.format.parse(trimmed, opts.opts);

			if (matchObj(config, data)) {
				const updatedObj = updateObj(config, data);
				out = opts.format.stringify(updatedObj, opts.opts);
				updated.push(updatedObj);
			}

			ws.write(out);
			ws.write(delimiter);
		}

		await new Promise<void>((res, rej) => {
			ws.once("error", rej);
			ws.end(() => res());
		});
	} catch (err) {
		ws.destroy();
		throw err;
	} finally {
		rl.close();
	}

	if (opts.journal?.isActive()) {
		await promises.rename(tmpFile, targetFile);
		return updated;
	}

	await promises.rename(tmpFile, file);

	return updated;
}
