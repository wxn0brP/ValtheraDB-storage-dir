import { appendFileSync } from "fs";
import { stringifyData } from "../format.js";
import { find, findOne } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
export const vFileCpu = {
    add: async (file, data) => {
        const dataString = stringifyData(data);
        appendFileSync(file, dataString + "\n");
    },
    find,
    findOne,
    update,
    remove,
};
