import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { matchObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils.js";
import { createRL, getDelimiter } from "./utils.js";
export async function remove(file, config, one, opts) {
    file = pathRepair(file);
    if (!(await exists(file)))
        return [];
    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");
    const delimiter = getDelimiter(opts);
    const rl = createRL(file, delimiter);
    const ws = createWriteStream(tmpFile, {
        flags: "a",
    });
    const removed = [];
    for await (const block of rl) {
        if (!block)
            continue;
        const trimmed = block.trim();
        if (one && removed.length) {
            ws.write(trimmed);
            ws.write(delimiter);
            continue;
        }
        if (!trimmed)
            continue;
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
        ws.end((err) => (err ? rej(err) : res(null)));
    });
    await promises.rename(tmpFile, file);
    return removed;
}
