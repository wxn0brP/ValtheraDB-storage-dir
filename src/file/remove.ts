import { pathRepair } from "@wxn0brp/db-core/customFileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { match } from "@wxn0brp/db-core/utils/process";
import { createWriteStream, promises } from "fs";
import { exists } from "../utils";
import { createRL } from "./utils";

export async function remove(file: string, config: VQueryT.Remove, one: boolean) {
    file = pathRepair(file);

    if (!await exists(file)) return [];

    const tmpFile = file + ".tmp";
    await promises.writeFile(tmpFile, "");

    const rl = createRL(file);
    const ws = createWriteStream(tmpFile, { flags: "a" });

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
        if (match(config, data)) {
            removed.push(data);
            continue;
        }

        ws.write(trimmed);
        ws.write("\n");
    }

    rl.close();
    await new Promise((res, rej) => {
        ws.end((err: any) => err ? rej(err) : res(null));
    });
    await promises.rename(tmpFile, file);

    return removed;
}
