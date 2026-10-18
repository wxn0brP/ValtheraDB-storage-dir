import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { exists } from "../utils.js";
import { createRL, getDelimiter } from "./utils.js";
export async function find(file, config, opts) {
    file = pathRepair(file);
    let readFile = file;
    if (opts.journal?.isActive()) {
        const stagingPath = opts.journal.getStagingPath(file);
        if (stagingPath) {
            readFile = stagingPath;
        }
    }
    if (!(await exists(readFile)))
        return [];
    const delimiter = getDelimiter(opts);
    const rl = createRL(readFile, delimiter);
    const results = [];
    try {
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
    }
    finally {
        rl.close();
    }
    return results;
}
export async function findOne(file, config, opts) {
    file = pathRepair(file);
    let readFile = file;
    if (opts.journal?.isActive()) {
        const stagingPath = opts.journal.getStagingPath(file);
        if (stagingPath) {
            readFile = stagingPath;
        }
    }
    if (!(await exists(readFile)))
        return null;
    const delimiter = getDelimiter(opts);
    const rl = createRL(readFile, delimiter);
    try {
        for await (const block of rl) {
            if (!block)
                continue;
            const trimmed = block.trim();
            if (!trimmed)
                continue;
            const res = findObj(config, opts.format.parse(block, opts.opts));
            if (res)
                return res;
        }
    }
    finally {
        rl.close();
    }
    return null;
}
