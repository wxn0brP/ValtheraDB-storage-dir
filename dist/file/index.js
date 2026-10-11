import { appendFile } from "fs/promises";
import { find, findOne } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
import { getDelimiter } from "./utils.js";
export const vFileCpu = {
    add: async (file, config, opts) => {
        const dataString = opts.format.stringify(config.data, opts);
        const content = dataString + getDelimiter(opts);
        if (opts.journal?.isActive()) {
            const stagingPath = await opts.journal.getOrCreateStaging(file);
            await appendFile(stagingPath, content);
            return;
        }
        await appendFile(file, content);
    },
    find,
    findOne,
    update,
    remove,
};
