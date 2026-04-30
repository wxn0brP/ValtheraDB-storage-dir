import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { appendFileSync, existsSync, promises } from "fs";
import { createRL } from "./utils.js";
/**
 * Removes entries from a file based on search criteria.
 */
export async function remove(file, config, one) {
    file = pathRepair(file);
    if (!existsSync(file)) {
        await promises.writeFile(file, "");
        return [];
    }
    await promises.copyFile(file, file + ".tmp");
    await promises.writeFile(file, "");
    const rl = createRL(file + ".tmp");
    const { search, context } = config;
    let removed = [];
    for await (let line of rl) {
        if (!line)
            continue;
        const trimmed = line.trim();
        if (one && removed.length) {
            appendFileSync(file, trimmed + "\n");
            continue;
        }
        if (!trimmed)
            continue;
        const data = config.control.dir.format.parse(trimmed);
        if (typeof search === "function") {
            if (search(data, context)) {
                removed.push(data);
                continue;
            }
        }
        else if (typeof search === "object" && !Array.isArray(search)) {
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
