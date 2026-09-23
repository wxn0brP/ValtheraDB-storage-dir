import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { Dirent } from "fs";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { join } from "path";
import { FileCpuOpts } from "./types";
import { exists } from "./utils";

export class FileActionsUtils {
	async getLastFile(
		path: string,
		maxFileSize: number,
		query: VQuery,
		opts?: FileCpuOpts,
	) {
		const inTx = opts?.journal?.isActive();

		if (!(await exists(path))) {
			if (!inTx) {
				await mkdir(path, {
					recursive: true,
				});
			}
		}
		const files = await this.getSortedFiles(path, query, opts);

		if (files.length === 0) {
			if (!inTx) {
				await writeFile(join(path, "1.db"), "");
			}
			return "1.db";
		}

		const last = files[files.length - 1];
		let info = join(path, last);

		if (inTx && opts?.journal) {
			const stagingPath = opts.journal.getStagingPath(info);
			if (stagingPath) {
				info = stagingPath;
			}
		}

		if (!(await exists(info))) {
			return last;
		}

		if ((await stat(info)).size < maxFileSize) return last;

		const num = parseInt(last.replace(".db", ""), 10) + 1;
		if (!inTx) {
			await writeFile(join(path, num + ".db"), "");
		}
		query.control ||= {} as any;
		query.control.dir ||= {};
		query.control.dir.lastFileNum = num;
		return num + ".db";
	}

	async getSortedFiles(
		folder: string,
		query: VQuery,
		opts?: FileCpuOpts,
	): Promise<string[]> {
		let files: Dirent[];
		try {
			files = await readdir(folder, {
				withFileTypes: true,
			});
		} catch {
			files = [];
		}

		const sorted = files
			.filter(file => file.isFile() && !file.name.endsWith(".tmp"))
			.map(file => file.name)
			.filter(name => /^\d+\.db$/.test(name));

		if (opts?.journal?.isActive()) {
			const stagedFiles = opts.journal.getStagedFiles(folder);
			for (const stagedFile of stagedFiles) {
				if (/^\d+\.db$/.test(stagedFile) && !sorted.includes(stagedFile)) {
					sorted.push(stagedFile);
				}
			}
		}

		sorted.sort((a, b) => {
			const numA = parseInt(a, 10);
			const numB = parseInt(b, 10);
			return numA - numB;
		});

		query.control ||= {} as any;
		query.control.dir ||= {};
		query.control.dir.sortedFiles = sorted;
		return sorted;
	}

	async operationUpdater(
		c_path: string,
		worker: (
			file: string,
			config: VQuery,
			one: boolean,
			opts: FileCpuOpts,
		) => Promise<DataInternal[]>,
		one: boolean,
		config: VQuery,
		opts: FileCpuOpts,
	): Promise<DataInternal[]> {
		const files = await this.getSortedFiles(c_path, config, opts);

		const update = [];
		for (const file of files) {
			const updated = await worker(c_path + file, config, one, opts);
			update.push(updated);
			if (one && updated) break;
		}
		return update.flat();
	}
}
