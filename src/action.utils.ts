import { VQuery } from "@wxn0brp/db-core/types/query";
import { exists, mkdir, readdir, stat, writeFile } from "fs/promises";

export class FileActionsUtils {
    /**
     * Get the last file in the specified directory.
     */
    async getLastFile(path: string, maxFileSize: number, query: VQuery) {
        if (!await exists(path))
            await mkdir(path, { recursive: true });
        const files = await this.getSortedFiles(path, query);

        if (files.length == 0) {
            await writeFile(path + "/1.db", "");
            return "1.db";
        }

        const last = files[files.length - 1];
        const info = path + "/" + last;

        if ((await stat(info)).size < maxFileSize) return last;

        const num = parseInt(last.replace(".db", ""), 10) + 1;
        await writeFile(path + "/" + num + ".db", "");
        query.context ||= {};
        query.context._dir_lastFileNum = num;
        return num + ".db";
    }

    /**
     * Get all files in a directory sorted by name.
     */
    async getSortedFiles(folder: string, query: VQuery): Promise<string[]> {
        const files = await readdir(folder, { withFileTypes: true });

        const sorted = files
            .filter(file => file.isFile() && !file.name.endsWith(".tmp"))
            .map(file => file.name)
            .filter(name => /^\d+\.db$/.test(name))
            .sort((a, b) => {
                const numA = parseInt(a, 10);
                const numB = parseInt(b, 10);
                return numA - numB;
            });

        query.context ||= {};
        query.context._dir_sortedFiles = sorted;
        return sorted;
    }

    async operationUpdater(
        c_path: string,
        worker: (file: string, one: boolean, ...args: any[]) => Promise<boolean>,
        one: boolean,
        query: VQuery,
        ...args: any[]
    ) {
        const files = await this.getSortedFiles(c_path, query);

        let update = false;
        for (const file of files) {
            const updated = await worker(c_path + file, one, ...args);
            update = update || updated;
            if (one && updated) break;
        }
        return update;
    }
}