import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { matchObj, updateObj } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils.js";
import { createRL } from "./utils.js";
export async function update(file, config, one) {
    file = pathRepair(file);
    if (!await exists(file))
        return [];
    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");
    const rl = createRL(file);
    const ws = createWriteStream(tmpFile, { flags: "a" });
    let updated = [];
    for await (let line of rl) {
        if (!line)
            continue;
        const trimmed = line.trim();
        if (one && updated.length) {
            ws.write(trimmed);
            ws.write("\n");
            continue;
        }
        if (!trimmed)
            continue;
        const data = config.control.dir.format.parse(trimmed);
        if (matchObj(config, data)) {
            const updatedObj = updateObj(config, data);
            line = config.control.dir.format.stringify(updatedObj);
            updated.push(updatedObj);
        }
        ws.write(line);
        ws.write("\n");
    }
    rl.close();
    await new Promise((res, rej) => {
        ws.end((err) => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);
    return updated;
}
