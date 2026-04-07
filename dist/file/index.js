import { appendFile } from "fs/promises";
import { find, findOne } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
export const vFileCpu = {
    add: async (file, config) => {
        const dataString = config.control.dir.format.stringify(config.data);
        await appendFile(file, dataString + "\n");
    },
    find,
    findOne,
    update,
    remove,
};
