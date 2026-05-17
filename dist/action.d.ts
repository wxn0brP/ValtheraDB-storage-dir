import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { FileActionsUtils } from "./action.utils.js";
import { DbDirOpts, Format } from "./types.js";
import { VQuery, VQueryT } from "@wxn0brp/db-core/types/query";
export declare class FileActions extends ActionsBase {
    fileCpu: FileCpu;
    utils: FileActionsUtils;
    folder: string;
    options: DbDirOpts;
    _inited: boolean;
    format: Format;
    /**
     * Creates a new instance of FileActions.
     * @param folder - The folder where database files are stored.
     * @param options - The options object.
     * @param fileCpu - The file cpu instance
     * @param utils - The utils instance
     */
    constructor(folder: string, options: DbDirOpts, fileCpu: FileCpu, utils?: FileActionsUtils);
    init(): Promise<void>;
    _getCollectionPath(collection: string): string;
    _ensureQueryFormat(query: VQuery): void;
    /**
     * Get a list of available databases in the specified folder.
     */
    getCollections(): Promise<string[]>;
    /**
     * Check and create the specified collection if it doesn't exist.
     */
    ensureCollection(collection: string): Promise<boolean>;
    /**
     * Check if a collection exists.
     */
    issetCollection(collection: string): Promise<boolean>;
    /**
     * Add a new entry to the specified database.
     */
    add(query: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<Data>>;
    /**
     * Find entries in the specified database based on search criteria.
     */
    find(query: VQueryT.Find): Promise<Data[]>;
    /**
     * Find the first matching entry in the specified database based on search criteria.
     */
    findOne(query: VQueryT.FindOne): Promise<Data>;
    /**
     * Update entries in the specified database based on search criteria and an updater function or object.
     */
    update(query: VQueryT.Update): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    /**
     * Update the first matching entry in the specified database based on search criteria and an updater function or object.
     */
    updateOne(query: VQueryT.Update): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    /**
     * Remove entries from the specified database based on search criteria.
     */
    remove(query: VQueryT.Remove): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    /**
     * Remove the first matching entry from the specified database based on search criteria.
     */
    removeOne(query: VQueryT.Remove): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    /**
     * Removes a database collection from the file system.
     */
    removeCollection(collection: string): Promise<boolean>;
}
