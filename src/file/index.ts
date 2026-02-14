import { Arg } from "@wxn0brp/db-core/types/arg";
import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { appendFileSync } from "fs";
import { stringifyData } from "../format";
import { find, findOne } from "./find";
import { remove } from "./remove";
import { update } from "./update";

export const vFileCpu: FileCpu = {
    add: async (file: string, data: Arg) => {
        const dataString = stringifyData(data);
        appendFileSync(file, dataString + "\n");
    },
    find,
    findOne,
    update,
    remove,
}
