import dbActionBase from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { promises } from "fs";
import { resolve, sep } from "path";
import { FileActionsUtils } from "./action.utils.js";
/**
 * A class representing database actions on files.
 * @class
 */
export class FileActions extends dbActionBase {
    fileCpu;
    utils;
    folder;
    options;
    _inited = false;
    /**
     * Creates a new instance of FileActions.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     * @param fileCpu - The file cpu instance
     * @param utils - The utils instance
     */
    constructor(folder, options, fileCpu, utils = new FileActionsUtils()) {
        super();
        this.fileCpu = fileCpu;
        this.utils = utils;
        this.folder = folder;
        this.options = {
            maxFileSize: 2 * 1024 * 1024, //2 MB
            ...options,
        };
    }
    async init() {
        if (!await promises.exists(this.folder))
            await promises.mkdir(this.folder, { recursive: true });
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
        const c_path = this._getCollectionPath(collection);
        await promises.mkdir(c_path, { recursive: true });
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
    async add(query) {
        const { collection, data } = query;
        await this.ensureCollection(query);
        const c_path = this._getCollectionPath(collection);
        const file = c_path + await this.utils.getLastFile(c_path, this.options.maxFileSize, query);
        await addId(query, this);
        await this.fileCpu.add(file, data);
        return data;
    }
    /**
     * Find entries in the specified database based on search criteria.
     */
    async find(query) {
        await this.ensureCollection(query);
        const c_path = this._getCollectionPath(query.collection);
        let files = await this.utils.getSortedFiles(c_path, query);
        if (files.length == 0)
            return [];
        files = files.map(file => c_path + file);
        const data = await findUtil(query, this.fileCpu, files);
        return data || [];
    }
    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    async findOne(query) {
        const { collection, search, context = {}, findOpts = {} } = query;
        await this.ensureCollection(query);
        const c_path = this._getCollectionPath(collection);
        const files = await this.utils.getSortedFiles(c_path, query);
        for (let f of files) {
            let data = await this.fileCpu.findOne(c_path + f, search, context, findOpts);
            if (data)
                return data;
        }
        return null;
    }
    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    async update(query) {
        const { collection, search, updater, context = {} } = query;
        await this.ensureCollection(query);
        return await this.utils.operationUpdater(this._getCollectionPath(collection), this.fileCpu.update.bind(this.fileCpu), false, query, search, updater, context);
    }
    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    async updateOne(query) {
        const { collection, search, updater, context = {} } = query;
        await this.ensureCollection(query);
        return await this.utils.operationUpdater(this._getCollectionPath(collection), this.fileCpu.update.bind(this.fileCpu), true, query, search, updater, context);
    }
    /**
     * Remove entries from the specified database based on search criteria.
     */
    async remove(query) {
        const { collection, search, context = {} } = query;
        await this.ensureCollection(query);
        return await this.utils.operationUpdater(this._getCollectionPath(collection), this.fileCpu.remove.bind(this.fileCpu), false, query, search, context);
    }
    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    async removeOne(query) {
        const { collection, search, context = {} } = query;
        await this.ensureCollection(query);
        return await this.utils.operationUpdater(this._getCollectionPath(collection), this.fileCpu.remove.bind(this.fileCpu), true, query, search, context);
    }
    /**
     * Removes a database collection from the file system.
     */
    async removeCollection({ collection }) {
        await promises.rm(this.folder + "/" + collection, { recursive: true, force: true });
        return true;
    }
}
export default FileActions;
