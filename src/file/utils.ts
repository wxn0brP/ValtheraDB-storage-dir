import { createReadStream, ReadStream } from "fs";
import { FileCpuOpts } from "../types";

export interface LineReader extends AsyncIterable<string> {
	close: () => void;
}

export function createRL(file: string, delimiter: string): LineReader {
	const stream: ReadStream = createReadStream(file, {
		highWaterMark: 64 * 1024,
	});

	let buffer = "";
	let done = false;
	let error: Error | null = null;
	const blocks: string[] = [];
	let waiting: ((result: IteratorResult<string>) => void) | null = null;

	stream.on("data", (chunk: Buffer) => {
		buffer += chunk.toString("utf8");
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
