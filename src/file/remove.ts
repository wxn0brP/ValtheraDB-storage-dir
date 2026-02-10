import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { Search } from "@wxn0brp/db-core/types/arg";
import { VContext } from "@wxn0brp/db-core/types/types";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { appendFileSync, existsSync, promises } from "fs";
import { parseData } from "../format";
import { createRL } from "./utils";

/**
 * Removes entries from a file based on search criteria.
 */
export async function remove(file: string, one: boolean, search: Search, context: VContext = {}) {
    file = pathRepair(file);
    if (!existsSync(file)) {
        await promises.writeFile(file, "");
        return [];
    }
    await promises.copyFile(file, file + ".tmp");
    await promises.writeFile(file, "");

    const rl = createRL(file + ".tmp");

    let removed = [];
    for await (let line of rl) {
        if (!line) continue;
        const trimmed = line.trim();

        if (one && removed.length) {
            appendFileSync(file, trimmed + "\n");
            continue;
        }
        if (!trimmed) continue;

        const data = parseData(trimmed);

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

        appendFileSync(file, line + "\n");
    }
    await promises.writeFile(file + ".tmp", "");
    return removed;
}