import { appendFile } from "fs/promises";
import { find, findOne } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
import { getDelimiter } from "./utils.js";
export const vFileCpu = {
    add: async (file, config, opts) => {
        const dataString = opts.format.stringify(config.data, opts);
        await appendFile(file, dataString + getDelimiter(opts));
    },
    find,
    findOne,
    update,
    remove,
};
