import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { appendFile } from "fs/promises";
import { find, findOne } from "./find";
import { remove } from "./remove";
import { update } from "./update";

export const vFileCpu: FileCpu = {
    add: async (file: string, config: VQueryT.Add) => {
        const dataString = config.control.dir.format.stringify(config.data);
        await appendFile(file, dataString + "\n");
    },
    find,
    findOne,
    update,
    remove,
}
