import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { matchObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils.js";
import { createRL, endStream, getDelimiter, getDelimiterBuffer, readBlocks, tmpPath, writeUpdateResult, } from "./utils.js";
export async function remove(file, config, one, opts) {
    file = pathRepair(file);
    let sourceFile = file;
    if (opts.journal?.isActive()) {
        const stagingPath = opts.journal.getStagingPath(file);
        if (stagingPath)
            sourceFile = stagingPath;
    }
    if (!(await exists(sourceFile)))
        return [];
    const blocks = await readBlocks(sourceFile, opts);
    if (!blocks)
        return removeStreaming(file, sourceFile, config, one, opts);
    const delimiter = getDelimiterBuffer(opts);
    const removed = [];
    const out = [];
    for (let i = 0; i < blocks.length; i++) {
        const raw = blocks[i];
        const trimmed = raw.toString("utf8").trim();
        if (!trimmed || (one && removed.length)) {
            out.push(raw);
            continue;
        }
        const data = opts.format.parse(trimmed, opts.opts);
        if (!matchObj(config, data)) {
            out.push(raw);
            continue;
        }
        removed.push(data);
        if (one) {
            for (let j = i + 1; j < blocks.length; j++) {
                out.push(blocks[j]);
            }
            break;
        }
    }
    if (removed.length === 0)
        return removed;
    const parts = [];
    for (const raw of out)
        parts.push(raw, delimiter);
    await writeUpdateResult(file, Buffer.concat(parts), opts);
    return removed;
}
async function removeStreaming(file, sourceFile, config, one, opts) {
    const delimiter = getDelimiter(opts);
    const tmpFile = tmpPath(file);
    const rl = createRL(sourceFile, delimiter);
    const ws = createWriteStream(tmpFile, {
        flags: "w",
    });
    const removed = [];
    try {
        for await (const block of rl) {
            const trimmed = block.trim();
            if (!trimmed || (one && removed.length)) {
                ws.write(block);
                ws.write(delimiter);
                continue;
            }
            const data = opts.format.parse(trimmed, opts.opts);
            if (matchObj(config, data)) {
                removed.push(data);
                continue;
            }
            ws.write(block);
            ws.write(delimiter);
        }
        await endStream(ws);
    }
    catch (err) {
        ws.destroy();
        await promises.unlink(tmpFile).catch(() => { });
        throw err;
    }
    finally {
        rl.close();
    }
    if (removed.length === 0) {
        await promises.unlink(tmpFile).catch(() => { });
        return removed;
    }
    if (opts.journal?.isActive()) {
        const stagingPath = await opts.journal.getOrCreateStaging(file);
        await promises.rename(tmpFile, stagingPath);
        return removed;
    }
    await promises.rename(tmpFile, file);
    return removed;
}
