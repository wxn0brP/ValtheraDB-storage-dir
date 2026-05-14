import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { findProcessLine } from "@wxn0brp/db-core/utils/process";
import { exists } from "../utils";
import { createRL } from "./utils";

export async function find(file: string, config: VQueryT.Find): Promise<any[]> {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve([]);
            return;
        }

        const rl = createRL(file);
        const results = [];
        for await (const line of rl) {
            if (!line) continue;
            const trimmed = line.trim();
            if (!trimmed) continue;

            const res = findProcessLine(config, config.control.dir.format.parse(line));
            if (res) results.push(res);
        };
        resolve(results);
        rl.close();
    })
}

export async function findOne(file: string, config: VQueryT.FindOne): Promise<any | null> {
    file = pathRepair(file);
    return await new Promise(async (resolve) => {
        if (!await exists(file)) {
            resolve(null);
            return;
        }

        const rl = createRL(file);
        for await (const line of rl) {
            if (!line) continue;
            const trimmed = line.trim();
            if (!trimmed) continue;

            const res = findProcessLine(config, config.control.dir.format.parse(line));
            if (res) {
                resolve(res);
                rl.close();
                return;
            }
        };
        resolve(null);
    });
}
