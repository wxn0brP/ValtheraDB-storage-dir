import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { AddQuery } from "@wxn0brp/db-core/types/query";
import { appendFileSync } from "fs";
import { stringifyData } from "../format";
import { find, findOne } from "./find";
import { remove } from "./remove";
import { update } from "./update";

export const vFileCpu: FileCpu = {
    add: async (file: string, config: AddQuery) => {
        const dataString = stringifyData(config.data);
        appendFileSync(file, dataString + "\n");
    },
    find,
    findOne,
    update,
    remove,
}
