import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Id } from "@wxn0brp/db-core/types/Id";
import { Data } from "@wxn0brp/db-core/types/data";
import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { VQuery, VQueryT } from "@wxn0brp/db-core/types/query";
import { TransactionHandle } from "@wxn0brp/db-core/types/transaction";
import { FileActionsUtils } from "./action.utils.js";
import { DirJournal } from "./journal.js";
import { DbDirOpts, FileCpuOpts, Format } from "./types.js";
export declare class FileActions extends ActionsBase {
    fileCpu: FileCpu;
    utils: FileActionsUtils;
    folder: string;
    options: DbDirOpts;
    _inited: boolean;
    format: Format;
    fileCpuOpts: FileCpuOpts;
    journal: DirJournal;
    activeTx: TransactionHandle;
    version: string;
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
     * Validate transaction handle.
     * If transaction is active, query must have matching transaction handle.
     * If no transaction is active, query must not have transaction handle.
     * If journal is poisoned, reject all operations.
     */
    _validateTransaction(query: VQuery): void;
    _getOpts(): FileCpuOpts;
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
    beginTransaction(id: Id): Promise<TransactionHandle>;
    commitTransaction(handle: TransactionHandle): Promise<void>;
    rollbackTransaction(handle: TransactionHandle): Promise<void>;
    /**
     * Recover from failed transaction state.
     * Resets active transaction, performs rollback, and clears poisoned state.
     */
    recover(): Promise<void>;
}
