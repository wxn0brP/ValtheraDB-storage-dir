import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { FileCpuOpts } from "../types";
import { exists } from "../utils";
import { createRL, getDelimiter, readBlocks } from "./utils";

function resolveSource(file: string, opts: FileCpuOpts) {
	if (opts.journal?.isActive()) {
		const stagingPath = opts.journal.getStagingPath(file);
		if (stagingPath) return stagingPath;
	}
	return file;
}

export async function find(
	file: string,
	config: VQueryT.Find,
	opts: FileCpuOpts,
): Promise<any[]> {
	file = pathRepair(file);
	const readFile = resolveSource(file, opts);

	if (!(await exists(readFile))) return [];

	const blocks = await readBlocks(readFile, opts);
	if (!blocks) return findStreaming(readFile, config, opts);

	const results = [];
	for (const raw of blocks) {
		if (raw.length === 0) continue;
		const block = raw.toString("utf8");
		if (!block.trim()) continue;

		const res = findObj(config, opts.format.parse(block, opts.opts));
		if (res) results.push(res);
	}
	return results;
}

export async function findOne(
	file: string,
	config: VQueryT.FindOne,
	opts: FileCpuOpts,
): Promise<any | null> {
	file = pathRepair(file);
	const readFile = resolveSource(file, opts);

	if (!(await exists(readFile))) return null;

	const blocks = await readBlocks(readFile, opts);
	if (!blocks) return findOneStreaming(readFile, config, opts);

	for (const raw of blocks) {
		if (raw.length === 0) continue;
		const block = raw.toString("utf8");
		if (!block.trim()) continue;

		const res = findObj(config, opts.format.parse(block, opts.opts));
		if (res) return res;
	}
	return null;
}

async function findStreaming(
	readFile: string,
	config: VQueryT.Find,
	opts: FileCpuOpts,
) {
	const rl = createRL(readFile, getDelimiter(opts));
	const results = [];
	try {
		for await (const block of rl) {
			if (!block) continue;
			const trimmed = block.trim();
			if (!trimmed) continue;

			const res = findObj(config, opts.format.parse(block, opts.opts));
			if (res) results.push(res);
		}
	} finally {
		rl.close();
	}
	return results;
}

async function findOneStreaming(
	readFile: string,
	config: VQueryT.FindOne,
	opts: FileCpuOpts,
) {
	const rl = createRL(readFile, getDelimiter(opts));
	try {
		for await (const block of rl) {
			if (!block) continue;
			const trimmed = block.trim();
			if (!trimmed) continue;

			const res = findObj(config, opts.format.parse(block, opts.opts));
			if (res) return res;
		}
	} finally {
		rl.close();
	}
	return null;
}
