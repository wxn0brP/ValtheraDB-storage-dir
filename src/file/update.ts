import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { match, update as updateUtil } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils";
import { createRL } from "./utils";

export async function update(file: string, config: VQueryT.Update, one: boolean) {
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

        if (match(config, data)) {
            const updateObj = updateUtil(config, data);
            line = config.control.dir.format.stringify(updateObj);
            updated.push(updateObj);
        }

        ws.write(line);
        ws.write("\n");
    }
    rl.close();

    await new Promise((res, rej) => {
        ws.end((err: any) => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);

    return updated;
}
