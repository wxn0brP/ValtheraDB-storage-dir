import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";
import { exists } from "../utils.js";
import { createRL } from "./utils.js";
function findProcesLine(config, line) {
    const obj = config.control.dir.format.parse(line);
    let res = false;
    const { search, context, findOpts = {} } = config;
    if (typeof search === "function") {
        if (search(obj, context))
            res = true;
    }
    else if (typeof search === "object" && !Array.isArray(search)) {
        if (hasFieldsAdvanced(obj, search))
            res = true;
    }
    if (res)
        return updateFindObject(obj, findOpts);
    return null;
}
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
            const res = findProcesLine(config, trimmed);
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
            const res = findProcesLine(config, trimmed);
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
