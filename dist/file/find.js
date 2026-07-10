import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { exists } from "../utils.js";
import { createRL, getDelimiter } from "./utils.js";
export async function find(file, config, opts) {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve([]);
            return;
        }
        const delimiter = getDelimiter(opts);
        const rl = createRL(file, delimiter);
        const results = [];
        for await (const block of rl) {
            if (!block)
                continue;
            const trimmed = block.trim();
            if (!trimmed)
                continue;
            const res = findObj(config, opts.format.parse(block, opts.opts));
            if (res)
                results.push(res);
        }
        ;
        resolve(results);
        rl.close();
    });
}
export async function findOne(file, config, opts) {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve(null);
            return;
        }
        const delimiter = getDelimiter(opts);
        const rl = createRL(file, delimiter);
        for await (const block of rl) {
            if (!block)
                continue;
            const trimmed = block.trim();
            if (!trimmed)
                continue;
            const res = findObj(config, opts.format.parse(block, opts.opts));
            if (res) {
                resolve(res);
                rl.close();
                return;
            }
        }
        ;
        resolve(null);
    });
}
