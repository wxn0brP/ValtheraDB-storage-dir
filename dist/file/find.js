import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { exists } from "../utils.js";
import { createRL } from "./utils.js";
export async function find(file, config) {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve([]);
            return;
        }
        const rl = createRL(file);
        const results = [];
        for await (const line of rl) {
            if (!line)
                continue;
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            const res = findObj(config, config.control.dir.format.parse(line));
            if (res)
                results.push(res);
        }
        ;
        resolve(results);
        rl.close();
    });
}
export async function findOne(file, config) {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve(null);
            return;
        }
        const rl = createRL(file);
        for await (const line of rl) {
            if (!line)
                continue;
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            const res = findObj(config, config.control.dir.format.parse(line));
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
