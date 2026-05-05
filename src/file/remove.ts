import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { RemoveQuery } from "@wxn0brp/db-core/types/query";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { createWriteStream, promises } from "fs";
import { createRL } from "./utils";
import { exists } from "../utils";

export async function remove(file: string, config: RemoveQuery, one: boolean) {
    file = pathRepair(file);

    if (!await exists(file)) return [];

    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");

    const rl = createRL(file);
    const ws = createWriteStream(tmpFile, { flags: "a" });
    const { search, context } = config;

    let removed = [];
    for await (let line of rl) {
        if (!line) continue;
        const trimmed = line.trim();

        if (one && removed.length) {
            ws.write(trimmed);
            ws.write("\n");
            continue;
        }
        if (!trimmed) continue;

        const data = config.control.dir.format.parse(trimmed);

        if (typeof search === "function") {
            if (search(data, context)) {
                removed.push(data);
                continue;
            }
        } else if (typeof search === "object" && !Array.isArray(search)) {
            if (hasFieldsAdvanced(data, search)) {
                removed.push(data);
                continue;
            }
        }

        ws.write(trimmed);
        ws.write("\n");
    }

    rl.close();
    await new Promise((res, rej) => {
        ws.end(err => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);

    return removed;
}
