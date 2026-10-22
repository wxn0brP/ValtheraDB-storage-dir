import { createReadStream, promises } from "fs";
/**
 * Files above this size are processed with the streaming fallback to keep
 * memory bounded. Regular shards are capped by `maxFileSize` (2 MB default).
 */
export const BUFFER_LIMIT = 32 * 1024 * 1024;
export function createRL(file, delimiter) {
    const stream = createReadStream(file, {
        highWaterMark: 64 * 1024,
    });
    stream.setEncoding("utf8");
    let buffer = "";
    let done = false;
    let error = null;
    const blocks = [];
    let waiting = null;
    stream.on("data", (chunk) => {
        buffer += chunk;
        let index;
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
                waiting(Promise.reject(error));
            }
            else if (blocks.length > 0) {
                waiting({
                    value: blocks.shift(),
                    done: false,
                });
            }
            else if (done) {
                waiting({
                    value: undefined,
                    done: true,
                });
            }
            else {
                return;
            }
            waiting = null;
        }
    };
    const iterator = {
        next() {
            if (error)
                return Promise.reject(error);
            if (blocks.length > 0)
                return Promise.resolve({
                    value: blocks.shift(),
                    done: false,
                });
            if (done)
                return Promise.resolve({
                    value: undefined,
                    done: true,
                });
            return new Promise(res => {
                waiting = res;
            });
        },
        return() {
            rl.close();
            return Promise.resolve({
                value: undefined,
                done: true,
            });
        },
    };
    const rl = {
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
export function getDelimiter(opts) {
    return opts.opts.delimiter || opts.format.delimiter || "\n";
}
export function getDelimiterBuffer(opts) {
    return Buffer.from(getDelimiter(opts));
}
export function splitBlocks(buffer, delimiter) {
    const blocks = [];
    let start = 0;
    let index;
    while ((index = buffer.indexOf(delimiter, start)) !== -1) {
        blocks.push(buffer.subarray(start, index));
        start = index + delimiter.length;
    }
    const tail = buffer.subarray(start);
    if (tail.length > 0)
        blocks.push(tail);
    return blocks;
}
export async function readBlocks(file, opts) {
    const info = await promises.stat(file);
    if (info.size > BUFFER_LIMIT)
        return null;
    const content = await promises.readFile(file);
    return splitBlocks(content, getDelimiterBuffer(opts));
}
export function tmpPath(file) {
    return `${file}.tmp`;
}
export function endStream(ws) {
    return new Promise((res, rej) => {
        ws.once("error", rej);
        ws.end(() => res());
    });
}
export async function writeUpdateResult(file, data, opts) {
    if (opts.journal?.isActive()) {
        const staging = await opts.journal.getOrCreateStaging(file);
        await promises.writeFile(staging, data);
        return;
    }
    const tmp = tmpPath(file);
    try {
        await promises.writeFile(tmp, data);
        await promises.rename(tmp, file);
    }
    catch (err) {
        await promises.unlink(tmp).catch(() => { });
        throw err;
    }
}
