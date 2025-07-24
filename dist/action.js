import dbActionBase from "@wxn0brp/db-core/base/actions";
import gen from "@wxn0brp/db-core/helpers/gen";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { existsSync, mkdirSync, promises, statSync } from "fs";
import { resolve, sep } from "path";
/**
 * A class representing database actions on files.
 * @class
 */
class dbActionC extends dbActionBase {
    folder;
    options;
    fileCpu;
    /**
     * Creates a new instance of dbActionC.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     */
    constructor(folder, options, fileCpu) {
        super();
        this.folder = folder;
        this.options = {
            maxFileSize: 2 * 1024 * 1024, //2 MB
            ...options,
        };
        this.fileCpu = fileCpu;
        if (!existsSync(folder))
            mkdirSync(folder, { recursive: true });
    }
    _getCollectionPath(collection) {
        return this.folder + "/" + collection + "/";
    }
    /**
     * Get a list of available databases in the specified folder.
     */
    async getCollections() {
        const allCollections = await promises.readdir(this.folder, { recursive: true, withFileTypes: true });
        const collections = allCollections
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
            const parentPath = resolve(dirent.parentPath);
            const baseFolder = resolve(this.folder);
            if (parentPath === baseFolder)
                return dirent.name;
            return parentPath.replace(baseFolder + sep, "") + "/" + dirent.name;
        });
        return collections;
    }
    /**
     * Check and create the specified collection if it doesn't exist.
     */
    async ensureCollection({ collection }) {
        if (await this.issetCollection(collection))
            return;
        const cpath = this._getCollectionPath(collection);
        await promises.mkdir(cpath, { recursive: true });
        return true;
    }
    /**
     * Check if a collection exists.
     */
    async issetCollection({ collection }) {
        const path = this._getCollectionPath(collection);
        try {
            await promises.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Add a new entry to the specified database.
     */
    async add({ collection, data, id_gen = true }) {
        await this.ensureCollection(arguments[0]);
        const cpath = this._getCollectionPath(collection);
        const file = cpath + await getLastFile(cpath, this.options.maxFileSize);
        if (id_gen)
            data._id = data._id || gen();
        await this.fileCpu.add(file, data);
        return data;
    }
    /**
     * Find entries in the specified database based on search criteria.
     */
    async find(query) {
        await this.ensureCollection(query);
        const cpath = this._getCollectionPath(query.collection);
        let files = await getSortedFiles(cpath);
        if (files.length == 0)
            return [];
        files = files.map(file => cpath + file);
        const data = await findUtil(query, this.fileCpu, files);
        return data || [];
    }
    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    async findOne({ collection, search, context = {}, findOpts = {} }) {
        await this.ensureCollection(arguments[0]);
        const cpath = this._getCollectionPath(collection);
        const files = await getSortedFiles(cpath);
        for (let f of files) {
            let data = await this.fileCpu.findOne(cpath + f, search, context, findOpts);
            if (data)
                return data;
        }
        return null;
    }
    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    async update({ collection, search, updater, context = {} }) {
        await this.ensureCollection(arguments[0]);
        return await operationUpdater(this._getCollectionPath(collection), this.fileCpu.update.bind(this.fileCpu), false, search, updater, context);
    }
    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    async updateOne({ collection, search, updater, context = {} }) {
        await this.ensureCollection(arguments[0]);
        return await operationUpdater(this._getCollectionPath(collection), this.fileCpu.update.bind(this.fileCpu), true, search, updater, context);
    }
    /**
     * Remove entries from the specified database based on search criteria.
     */
    async remove({ collection, search, context = {} }) {
        await this.ensureCollection(arguments[0]);
        return await operationUpdater(this._getCollectionPath(collection), this.fileCpu.remove.bind(this.fileCpu), false, search, context);
    }
    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    async removeOne({ collection, search, context = {} }) {
        await this.ensureCollection(arguments[0]);
        return await operationUpdater(this._getCollectionPath(collection), this.fileCpu.remove.bind(this.fileCpu), true, search, context);
    }
    /**
     * Removes a database collection from the file system.
     */
    async removeCollection({ collection }) {
        await promises.rm(this.folder + "/" + collection, { recursive: true, force: true });
        return true;
    }
}
/**
 * Get the last file in the specified directory.
 */
async function getLastFile(path, maxFileSize = 1024 * 1024) {
    if (!existsSync(path))
        mkdirSync(path, { recursive: true });
    const files = await getSortedFiles(path);
    if (files.length == 0) {
        await promises.writeFile(path + "/1.db", "");
        return "1.db";
    }
    const last = files[files.length - 1];
    const info = path + "/" + last;
    if (statSync(info).size < maxFileSize)
        return last;
    const num = parseInt(last.replace(".db", ""), 10) + 1;
    await promises.writeFile(path + "/" + num + ".db", "");
    return num + ".db";
}
/**
 * Get all files in a directory sorted by name.
 */
async function getSortedFiles(folder) {
    const files = await promises.readdir(folder, { withFileTypes: true });
    return files
        .filter(file => file.isFile() && !file.name.endsWith(".tmp"))
        .map(file => file.name)
        .filter(name => /^\d+\.db$/.test(name))
        .sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numA - numB;
    });
}
async function operationUpdater(cpath, worker, one, ...args) {
    const files = await getSortedFiles(cpath);
    let update = false;
    for (const file of files) {
        const updated = await worker(cpath + file, one, ...args);
        update = update || updated;
        if (one && updated)
            break;
    }
    return update;
}
export default dbActionC;
