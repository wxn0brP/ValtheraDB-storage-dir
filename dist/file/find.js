import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { exists } from "../utils.js";
import { createRL, getDelimiter, readBlocks } from "./utils.js";
function resolveSource(file, opts) {
    if (opts.journal?.isActive()) {
        const stagingPath = opts.journal.getStagingPath(file);
        if (stagingPath)
            return stagingPath;
    }
    return file;
}
export async function find(file, config, opts) {
    file = pathRepair(file);
    const readFile = resolveSource(file, opts);
    if (!(await exists(readFile)))
        return [];
    const blocks = await readBlocks(readFile, opts);
    if (!blocks)
        return findStreaming(readFile, config, opts);
    const results = [];
    for (const raw of blocks) {
        if (raw.length === 0)
            continue;
        const block = raw.toString("utf8");
        if (!block.trim())
            continue;
        const res = findObj(config, opts.format.parse(block, opts.opts));
        if (res)
            results.push(res);
    }
    return results;
}
export async function findOne(file, config, opts) {
    file = pathRepair(file);
    const readFile = resolveSource(file, opts);
    if (!(await exists(readFile)))
        return null;
    const blocks = await readBlocks(readFile, opts);
    if (!blocks)
        return findOneStreaming(readFile, config, opts);
    for (const raw of blocks) {
        if (raw.length === 0)
            continue;
        const block = raw.toString("utf8");
        if (!block.trim())
            continue;
        const res = findObj(config, opts.format.parse(block, opts.opts));
        if (res)
            return res;
    }
    return null;
}
async function findStreaming(readFile, config, opts) {
    const rl = createRL(readFile, getDelimiter(opts));
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
async function findOneStreaming(readFile, config, opts) {
    const rl = createRL(readFile, getDelimiter(opts));
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
