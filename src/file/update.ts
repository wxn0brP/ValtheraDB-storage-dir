import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { matchObj, updateObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { FileCpuOpts } from "../types";
import { exists } from "../utils";
import {
	createRL,
	endStream,
	getDelimiter,
	getDelimiterBuffer,
	readBlocks,
	tmpPath,
	writeUpdateResult,
} from "./utils";

export async function update(
	file: string,
	config: VQueryT.Update,
	one: boolean,
	opts: FileCpuOpts,
) {
	file = pathRepair(file);

	let sourceFile = file;
	if (opts.journal?.isActive()) {
		const stagingPath = opts.journal.getStagingPath(file);
		if (stagingPath) sourceFile = stagingPath;
	}

	if (!(await exists(sourceFile))) return [];

	const blocks = await readBlocks(sourceFile, opts);
	if (!blocks) return updateStreaming(file, sourceFile, config, one, opts);

	const delimiter = getDelimiterBuffer(opts);
	const updated: any[] = [];
	const out: Buffer[] = [];

	for (let i = 0; i < blocks.length; i++) {
		const raw = blocks[i];
		const trimmed = raw.toString("utf8").trim();

		if (!trimmed || (one && updated.length)) {
			out.push(raw);
			continue;
		}

		const data = opts.format.parse(trimmed, opts.opts);

		if (!matchObj(config, data)) {
			out.push(raw);
			continue;
		}

		const updatedObj = updateObj(config, data);
		out.push(Buffer.from(opts.format.stringify(updatedObj, opts.opts)));
		updated.push(updatedObj);

		if (one) {
			for (let j = i + 1; j < blocks.length; j++) {
				out.push(blocks[j]);
			}
			break;
		}
	}

	if (updated.length === 0) return updated;

	const parts: Buffer[] = [];
	for (const raw of out) parts.push(raw, delimiter);

	await writeUpdateResult(file, Buffer.concat(parts), opts);

	return updated;
}

async function updateStreaming(
	file: string,
	sourceFile: string,
	config: VQueryT.Update,
	one: boolean,
	opts: FileCpuOpts,
) {
	const delimiter = getDelimiter(opts);
	const tmpFile = tmpPath(file);
	const rl = createRL(sourceFile, delimiter);
	const ws = createWriteStream(tmpFile, {
		flags: "w",
	});
	const updated: any[] = [];

	try {
		for await (const block of rl) {
			const trimmed = block.trim();

			if (!trimmed || (one && updated.length)) {
				ws.write(block);
				ws.write(delimiter);
				continue;
			}

			const data = opts.format.parse(trimmed, opts.opts);
			let out = block;

			if (matchObj(config, data)) {
				const updatedObj = updateObj(config, data);
				out = opts.format.stringify(updatedObj, opts.opts);
				updated.push(updatedObj);
			}

			ws.write(out);
			ws.write(delimiter);
		}

		await endStream(ws);
	} catch (err) {
		ws.destroy();
		await promises.unlink(tmpFile).catch(() => {});
		throw err;
	} finally {
		rl.close();
	}

	if (updated.length === 0) {
		await promises.unlink(tmpFile).catch(() => {});
		return updated;
	}

	if (opts.journal?.isActive()) {
		const stagingPath = await opts.journal.getOrCreateStaging(file);
		await promises.rename(tmpFile, stagingPath);
		return updated;
	}

	await promises.rename(tmpFile, file);

	return updated;
}
