import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { matchObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils.js";
import { createRL } from "./utils.js";
export async function remove(file, config, one) {
    file = pathRepair(file);
    if (!await exists(file))
        return [];
    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");
    const rl = createRL(file);
    const ws = createWriteStream(tmpFile, { flags: "a" });
    let removed = [];
    for await (let line of rl) {
        if (!line)
            continue;
        const trimmed = line.trim();
        if (one && removed.length) {
            ws.write(trimmed);
            ws.write("\n");
            continue;
        }
        if (!trimmed)
            continue;
        const data = config.control.dir.format.parse(trimmed);
        if (matchObj(config, data)) {
            removed.push(data);
            continue;
        }
        ws.write(trimmed);
        ws.write("\n");
    }
    rl.close();
    await new Promise((res, rej) => {
        ws.end((err) => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);
    return removed;
}
