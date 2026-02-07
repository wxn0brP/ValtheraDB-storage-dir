import dbActionBase from "@wxn0brp/db-core/base/actions";
import Data from "@wxn0brp/db-core/types/data";
import FileCpu from "@wxn0brp/db-core/types/fileCpu";
import { DbOpts } from "@wxn0brp/db-core/types/options";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { FileActionsUtils } from "./action.utils.js";
/**
 * A class representing database actions on files.
 * @class
 */
export declare class FileActions extends dbActionBase {
    fileCpu: FileCpu;
    utils: FileActionsUtils;
    folder: string;
    options: DbOpts;
    _inited: boolean;
    /**
     * Creates a new instance of FileActions.
     * @constructor
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     * @param fileCpu - The file cpu instance
     * @param utils - The utils instance
     */
    constructor(folder: string, options: DbOpts, fileCpu: FileCpu, utils?: FileActionsUtils);
    init(): Promise<void>;
    _getCollectionPath(collection: string): string;
    /**
     * Get a list of available databases in the specified folder.
     */
    getCollections(): Promise<string[]>;
    /**
     * Check and create the specified collection if it doesn't exist.
     */
    ensureCollection({ collection }: VQuery): Promise<boolean>;
    /**
     * Check if a collection exists.
     */
    issetCollection({ collection }: VQuery): Promise<boolean>;
    /**
     * Add a new entry to the specified database.
     */
    add({ collection, data }: VQuery): Promise<import("@wxn0brp/db-core/types/arg").Arg>;
    /**
     * Find entries in the specified database based on search criteria.
     */
    find(query: VQuery): Promise<Data[]>;
    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    findOne({ collection, search, context, findOpts }: VQuery): Promise<Data>;
    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    update({ collection, search, updater, context }: VQuery): Promise<boolean>;
    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    updateOne({ collection, search, updater, context }: VQuery): Promise<boolean>;
    /**
     * Remove entries from the specified database based on search criteria.
     */
    remove({ collection, search, context }: VQuery): Promise<boolean>;
    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    removeOne({ collection, search, context }: VQuery): Promise<boolean>;
    /**
     * Removes a database collection from the file system.
     */
    removeCollection({ collection }: {
        collection: any;
    }): Promise<boolean>;
}
export default FileActions;
