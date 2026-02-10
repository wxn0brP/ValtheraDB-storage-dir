import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { Search } from "@wxn0brp/db-core/types/arg";
import { FindOpts } from "@wxn0brp/db-core/types/options";
import { VContext } from "@wxn0brp/db-core/types/types";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";
import { existsSync, promises } from "fs";
import { parseData } from "../format";
import { createRL } from "./utils";

/**
 * Processes a line of text from a file and checks if it matches the search criteria.
 */
async function findProcesLine(search: Search, line: string, context: VContext = {}, findOpts: FindOpts = {}) {
    const ob = parseData(line);
    let res = false;

    if (typeof search === "function") {
        if (search(ob, context)) res = true;
    } else if (typeof search === "object" && !Array.isArray(search)) {
        if (hasFieldsAdvanced(ob, search)) res = true;
    }

    if (res) return updateFindObject(ob, findOpts);
    return null;
}

/**
 * Asynchronously finds entries in a file based on search criteria.
 */
export async function find(file: string, search: Search, context: VContext = {}, findOpts: FindOpts = {}): Promise<any[]> {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!existsSync(file)) {
            await promises.writeFile(file, "");
            resolve([]);
            return;
        }

        const rl = createRL(file);
        const results = [];
        for await (const line of rl) {
            if (!line) continue;
            const trimmed = line.trim();
            if (!trimmed) continue;

            const res = await findProcesLine(search, trimmed, context, findOpts);
            if (res) results.push(res);
        };
        resolve(results);
        rl.close();
    })
}

/**
 * Asynchronously finds one entry in a file based on search criteria.
 */
export async function findOne(file: string, search: Search, context: VContext = {}, findOpts: FindOpts = {}): Promise<any | false> {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!existsSync(file)) {
            await promises.writeFile(file, "");
            resolve(false);
            return;
        }

        const rl = createRL(file);
        for await (const line of rl) {
            if (!line) continue;
            const trimmed = line.trim();
            if (!trimmed) continue;

            const res = await findProcesLine(search, trimmed, context, findOpts);
            if (res) {
                resolve(res);
                rl.close();
            }
        };
        resolve(false);
    });
}