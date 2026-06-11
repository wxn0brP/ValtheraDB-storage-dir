import { createReadStream } from "fs";
export function createRL(file, delimiter) {
    const stream = createReadStream(file, { highWaterMark: 64 * 1024 });
    let buffer = "";
    let done = false;
    let error = null;
    const blocks = [];
    let waiting = null;
    stream.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
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
    stream.on("error", (err) => {
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
                waiting({ value: blocks.shift(), done: false });
            }
            else if (done) {
                waiting({ value: undefined, done: true });
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
                return Promise.resolve({ value: blocks.shift(), done: false });
            if (done)
                return Promise.resolve({ value: undefined, done: true });
            return new Promise(res => {
                waiting = res;
            });
        },
        return() {
            rl.close();
            return Promise.resolve({ value: undefined, done: true });
        }
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
        }
    };
    return rl;
}
export function getDelimiter(opts) {
    return opts.opts.delimiter || opts.format.delimiter || "\n";
}
