import { access, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
export async function exists(path) {
    try {
        await access(path);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Removes leftover temporary files from interrupted writes.
 */
export async function cleanupTmpFiles(folder) {
    const entries = await readdir(folder, {
        withFileTypes: true,
    }).catch(() => null);
    if (!entries)
        return;
    for (const entry of entries) {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) {
            await cleanupTmpFiles(path);
        }
        else if (entry.name.endsWith(".tmp")) {
            await unlink(path).catch(() => { });
        }
    }
}
