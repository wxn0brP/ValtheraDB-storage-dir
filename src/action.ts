import dbActionBase from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import Data from "@wxn0brp/db-core/types/data";
import FileCpu from "@wxn0brp/db-core/types/fileCpu";
import { DbOpts } from "@wxn0brp/db-core/types/options";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { promises } from "fs";
import { resolve, sep } from "path";
import { FileActionsUtils } from "./action.utils";

/**
 * A class representing database actions on files.
 * @class
 */
export class FileActions extends dbActionBase {
    folder: string;
    options: DbOpts;
    _inited = false;

    /**
     * Creates a new instance of FileActions.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     * @param fileCpu - The file cpu instance
     * @param utils - The utils instance
     */
    constructor(
        folder: string,
        options: DbOpts,
        public fileCpu: FileCpu,
        public utils = new FileActionsUtils(),
    ) {
        super();
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

    _getCollectionPath(collection: string) {
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

                if (parentPath === baseFolder) return dirent.name;
                return parentPath.replace(baseFolder + sep, "") + "/" + dirent.name;
            });

        return collections;
    }

    /**
     * Check and create the specified collection if it doesn't exist.
     */
    async ensureCollection({ collection }: VQuery) {
        if (await this.issetCollection(collection)) return;
        const c_path = this._getCollectionPath(collection);
        await promises.mkdir(c_path, { recursive: true });
        return true;
    }

    /**
     * Check if a collection exists.
     */
    async issetCollection({ collection }: VQuery) {
        const path = this._getCollectionPath(collection);
        try {
            await promises.access(path);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Add a new entry to the specified database.
     */
    async add({ collection, data }: VQuery) {
        await this.ensureCollection(arguments[0]);
        const c_path = this._getCollectionPath(collection);
        const file = c_path + await this.utils.getLastFile(c_path, this.options.maxFileSize);

        await addId(arguments[0], this);
        await this.fileCpu.add(file, data);
        return data;
    }

    /**
     * Find entries in the specified database based on search criteria.
     */
    async find(query: VQuery) {
        await this.ensureCollection(query);

        const c_path = this._getCollectionPath(query.collection);
        let files = await this.utils.getSortedFiles(c_path);
        if (files.length == 0) return [];

        files = files.map(file => c_path + file);
        const data = await findUtil(query, this.fileCpu, files);
        return data || [];
    }

    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    async findOne({ collection, search, context = {}, findOpts = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        const c_path = this._getCollectionPath(collection);
        const files = await this.utils.getSortedFiles(c_path);

        for (let f of files) {
            let data = await this.fileCpu.findOne(c_path + f, search, context, findOpts) as Data;
            if (data) return data;
        }
        return null;
    }

    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    async update({ collection, search, updater, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.utils.operationUpdater(
            this._getCollectionPath(collection),
            this.fileCpu.update.bind(this.fileCpu),
            false,
            search,
            updater,
            context
        )
    }

    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    async updateOne({ collection, search, updater, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.utils.operationUpdater(
            this._getCollectionPath(collection),
            this.fileCpu.update.bind(this.fileCpu),
            true,
            search,
            updater,
            context
        )
    }

    /**
     * Remove entries from the specified database based on search criteria.
     */
    async remove({ collection, search, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.utils.operationUpdater(
            this._getCollectionPath(collection),
            this.fileCpu.remove.bind(this.fileCpu),
            false,
            search,
            context
        )
    }

    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    async removeOne({ collection, search, context = {} }: VQuery) {
        await this.ensureCollection(arguments[0]);
        return await this.utils.operationUpdater(
            this._getCollectionPath(collection),
            this.fileCpu.remove.bind(this.fileCpu),
            true,
            search,
            context
        );
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