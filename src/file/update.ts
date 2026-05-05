import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { UpdateQuery } from "@wxn0brp/db-core/types/query";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { updateObjectAdvanced } from "@wxn0brp/db-core/utils/updateObject";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils";
import { createRL } from "./utils";

export async function update(file: string, config: UpdateQuery, one: boolean) {
    file = pathRepair(file);

    if (!await exists(file)) return [];

    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");

    const rl = createRL(file);
    const ws = createWriteStream(tmpFile, { flags: "a" });

    const { search, updater, context } = config;

    let updated = [];
    for await (let line of rl) {
        if (!line) continue;
        const trimmed = line.trim();

        if (one && updated.length) {
            ws.write(trimmed);
            ws.write("\n");
            continue;
        }

        if (!trimmed) continue;
        const data = config.control.dir.format.parse(trimmed);
        let match = false;

        if (typeof search === "function") {
            match = search(data, context) || false;
        } else if (typeof search === "object" && !Array.isArray(search)) {
            match = hasFieldsAdvanced(data, search);
        }

        if (match) {
            let updateObj = data;
            if (typeof updater === "function") {
                const updateObjValue = updater(data, context);
                if (updateObjValue) updateObj = updateObjValue;
            } else if (typeof updater === "object" && !Array.isArray(updater)) {
                updateObj = updateObjectAdvanced(data, updater);
            }
            line = config.control.dir.format.stringify(updateObj);
            updated.push(updateObj);
        }

        ws.write(line);
        ws.write("\n");
    }
    rl.close();

    await new Promise((res, rej) => {
        ws.end(err => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);

    return updated;
}
