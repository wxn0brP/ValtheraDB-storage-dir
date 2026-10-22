import { createReadStream, promises, ReadStream, WriteStream } from "fs";
import { FileCpuOpts } from "../types";

/**
 * Files above this size are processed with the streaming fallback to keep
 * memory bounded. Regular shards are capped by `maxFileSize` (2 MB default).
 */
export const BUFFER_LIMIT = 32 * 1024 * 1024;

export interface LineReader extends AsyncIterable<string> {
	close: () => void;
}

export function createRL(file: string, delimiter: string): LineReader {
	const stream: ReadStream = createReadStream(file, {
		highWaterMark: 64 * 1024,
	});
	stream.setEncoding("utf8");

	let buffer = "";
	let done = false;
	let error: Error | null = null;
	const blocks: string[] = [];
	let waiting: ((result: IteratorResult<string>) => void) | null = null;

	stream.on("data", (chunk: string) => {
		buffer += chunk;
		let index: number;
		while ((index = buffer.indexOf(delimiter)) >= 0) {
			const block = buffer.slice(0, index);
			blocks.push(block);
			buffer = buffer.slice(index + delimiter.length);
		}
		feed();
	});

	stream.on("end", () => {
		if (buffer.length > 0) {
			blocks.push(buffer);
			buffer = "";
		}
		done = true;
		feed();
	});

	stream.on("error", err => {
		error = err;
		done = true;
		feed();
	});

	const feed = () => {
		if (waiting) {
			if (error) {
				waiting(Promise.reject(error) as any);
			} else if (blocks.length > 0) {
				waiting({
					value: blocks.shift()!,
					done: false,
				});
			} else if (done) {
				waiting({
					value: undefined,
					done: true,
				});
			} else {
				return;
			}
			waiting = null;
		}
	};

	const iterator: AsyncIterator<string> = {
		next(): Promise<IteratorResult<string>> {
			if (error) return Promise.reject(error);
			if (blocks.length > 0)
				return Promise.resolve({
					value: blocks.shift()!,
					done: false,
				});
			if (done)
				return Promise.resolve({
					value: undefined,
					done: true,
				});

			return new Promise<IteratorResult<string>>(res => {
				waiting = res;
			});
		},
		return(): Promise<IteratorResult<string>> {
			rl.close();
			return Promise.resolve({
				value: undefined,
				done: true,
			});
		},
	};

	const rl: LineReader = {
		[Symbol.asyncIterator]() {
			return iterator;
		},
		close() {
			if (!done) {
				done = true;
				stream.destroy();
			}
		},
	};

	return rl;
}

export function getDelimiter(opts: FileCpuOpts) {
	return opts.opts.delimiter || opts.format.delimiter || "\n";
}

export function getDelimiterBuffer(opts: FileCpuOpts) {
	return Buffer.from(getDelimiter(opts));
}

export function splitBlocks(buffer: Buffer, delimiter: Buffer): Buffer[] {
	const blocks: Buffer[] = [];
	let start = 0;
	let index: number;

	while ((index = buffer.indexOf(delimiter, start)) !== -1) {
		blocks.push(buffer.subarray(start, index));
		start = index + delimiter.length;
	}

	const tail = buffer.subarray(start);
	if (tail.length > 0) blocks.push(tail);

	return blocks;
}

export async function readBlocks(file: string, opts: FileCpuOpts) {
	const info = await promises.stat(file);
	if (info.size > BUFFER_LIMIT) return null;

	const content = await promises.readFile(file);
	return splitBlocks(content, getDelimiterBuffer(opts));
}

export async function* scanRecords(file: string, delimiter: Buffer) {
	const stream = createReadStream(file, {
		highWaterMark: 64 * 1024,
	});
	let buffer: Buffer = Buffer.alloc(0);

	for await (const chunk of stream) {
		const data = chunk as Buffer;
		buffer = buffer.length
			? Buffer.concat([
					buffer,
					data,
				])
			: data;

		let index: number;
		while ((index = buffer.indexOf(delimiter)) !== -1) {
			yield buffer.subarray(0, index);
			buffer = buffer.subarray(index + delimiter.length);
		}
	}

	if (buffer.length > 0) yield buffer;
}

export function tmpPath(file: string) {
	return `${file}.tmp`;
}

export function endStream(ws: WriteStream) {
	return new Promise<void>((res, rej) => {
		ws.once("error", rej);
		ws.end(() => res());
	});
}

export async function writeUpdateResult(
	file: string,
	data: Buffer,
	opts: FileCpuOpts,
) {
	if (opts.journal?.isActive()) {
		const staging = await opts.journal.getOrCreateStaging(file);
		await promises.writeFile(staging, data);
		return;
	}

	const tmp = tmpPath(file);
	try {
		await promises.writeFile(tmp, data);
		await promises.rename(tmp, file);
	} catch (err) {
		await promises.unlink(tmp).catch(() => {});
		throw err;
	}
}
