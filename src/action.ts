import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { Id } from "@wxn0brp/db-core/types/Id";
import { Data } from "@wxn0brp/db-core/types/data";
import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { VQuery, VQueryT } from "@wxn0brp/db-core/types/query";
import { TransactionHandle } from "@wxn0brp/db-core/types/transaction";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { promises } from "fs";
import { join, resolve, sep } from "path";
import { FileActionsUtils } from "./action.utils";
import { extendJson, format } from "./format";
import { DirJournal } from "./journal";
import { DbDirOpts, FileCpuOpts, Format } from "./types";
import { exists } from "./utils";
import { version } from "./version";

export class FileActions extends ActionsBase {
	folder: string;
	options: DbDirOpts;
	_inited = false;
	format: Format;
	fileCpuOpts: FileCpuOpts;
	journal: DirJournal;
	activeTx: TransactionHandle = null;
	version = version;

	/**
	 * Creates a new instance of FileActions.
	 * @param folder - The folder where database files are stored.
	 * @param options - The options object.
	 * @param fileCpu - The file cpu instance
	 * @param utils - The utils instance
	 */
	constructor(
		folder: string,
		options: DbDirOpts,
		public fileCpu: FileCpu,
		public utils = new FileActionsUtils(),
	) {
		super();
		this.folder = folder;
		this.journal = new DirJournal(folder);
		this.options = {
			maxFileSize: 2 * 1024 * 1024, //2 MB
			format: "json5:x",
			...options,
		};

		if (typeof this.options.format === "string") {
			const [name, x] = this.options.format.split(":");
			if (format[name]) {
				if (x) this.format = extendJson(format[name]);
				else
					this.format = {
						...format[name],
					};
			} else {
				throw new Error(`Unknown format: ${this.options.format}`);
			}
		} else {
			this.format = this.options.format as Format;
		}

		this.fileCpuOpts = {
			format: this.format,
			opts: this.options,
		};
	}

	async init() {
		if (!(await exists(this.folder)))
			await promises.mkdir(this.folder, {
				recursive: true,
			});
		await this.journal.cleanupStaging();
		await this.format?.init?.();
	}

	_getCollectionPath(collection: string) {
		return this.folder + "/" + collection + "/";
	}

	_ensureQueryFormat(query: VQuery) {
		query.control ||= {};
		query.control.dir ||= {};
	}

	/**
	 * Validate transaction handle.
	 * If transaction is active, query must have matching transaction handle.
	 * If no transaction is active, query must not have transaction handle.
	 * If journal is poisoned, reject all operations.
	 */
	_validateTransaction(query: VQuery) {
		if (this.journal.isPoisoned()) {
			throw new Error(
				"journal is poisoned from previous failed commit, cannot perform operations",
			);
		}
		const txHandle = query.transaction;
		if (this.activeTx) {
			if (!txHandle || txHandle.id !== this.activeTx.id) {
				throw new Error(
					"transaction is active but operation has no or mismatched handle",
				);
			}
		}
	}

	_getOpts(): FileCpuOpts {
		return {
			...this.fileCpuOpts,
			journal: this.journal,
		};
	}

	/**
	 * Get a list of available databases in the specified folder.
	 */
	async getCollections() {
		const allCollections = await promises.readdir(this.folder, {
			recursive: true,
			withFileTypes: true,
		});
		const collections = allCollections
			.filter(dirent => dirent.isDirectory())
			.map(dirent => {
				const parentPath = resolve(dirent.parentPath);
				const baseFolder = resolve(this.folder);

				if (parentPath === baseFolder) return dirent.name;
				return join(parentPath.replace(baseFolder + sep, ""), dirent.name);
			});

		return collections;
	}

	/**
	 * Check and create the specified collection if it doesn't exist.
	 */
	async ensureCollection(collection: string) {
		if (await this.issetCollection(collection)) return false;
		const c_path = this._getCollectionPath(collection);
		if (this.journal.isActive()) {
			if (!this.journal.hasMkdir(c_path)) {
				this.journal.bufferMkdir(c_path);
			}
			return true;
		}
		await promises.mkdir(c_path, {
			recursive: true,
		});
		return true;
	}

	/**
	 * Check if a collection exists.
	 */
	async issetCollection(collection: string) {
		const path = this._getCollectionPath(collection);
		if (this.journal.hasMkdir(path)) return true;
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
	async add(query: VQueryT.Add) {
		this._validateTransaction(query);
		const { collection, data } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(collection);
		const c_path = this._getCollectionPath(collection);
		const file =
			c_path +
			(await this.utils.getLastFile(
				c_path,
				this.options.maxFileSize,
				query,
				this._getOpts(),
			));

		if (this.activeTx && !query.transaction) {
			query.transaction = this.activeTx;
		}
		await addId(query, this);
		await this.fileCpu.add(file, query, this._getOpts());
		return data;
	}

	/**
	 * Find entries in the specified database based on search criteria.
	 */
	async find(query: VQueryT.Find) {
		this._validateTransaction(query);
		await this.ensureCollection(query.collection);
		this._ensureQueryFormat(query);

		const c_path = this._getCollectionPath(query.collection);
		let files = await this.utils.getSortedFiles(c_path, query, this._getOpts());
		if (files.length === 0) return [];

		files = files.map(file => c_path + file);
		const data = await findUtil(query, this.fileCpu, files, this._getOpts());
		return data || [];
	}

	/**
	 * Find the first matching entry in the specified database based on search criteria.
	 */
	async findOne(query: VQueryT.FindOne) {
		this._validateTransaction(query);
		const { collection } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(collection);
		const c_path = this._getCollectionPath(collection);
		const files = await this.utils.getSortedFiles(
			c_path,
			query,
			this._getOpts(),
		);

		for (const f of files) {
			const data = (await this.fileCpu.findOne(
				c_path + f,
				query,
				this._getOpts(),
			)) as Data;
			if (data) return data;
		}
		return null;
	}

	/**
	 * Update entries in the specified database based on search criteria and an updater function or object.
	 */
	async update(query: VQueryT.Update) {
		this._validateTransaction(query);
		const { collection } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(collection);

		return await this.utils.operationUpdater(
			this._getCollectionPath(collection),
			this.fileCpu.update.bind(this.fileCpu),
			false,
			query,
			this._getOpts(),
		);
	}

	/**
	 * Update the first matching entry in the specified database based on search criteria and an updater function or object.
	 */
	async updateOne(query: VQueryT.Update) {
		this._validateTransaction(query);
		const { collection } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(collection);

		const res = await this.utils.operationUpdater(
			this._getCollectionPath(collection),
			this.fileCpu.update.bind(this.fileCpu),
			true,
			query,
			this._getOpts(),
		);

		return res[0] ?? null;
	}

	/**
	 * Remove entries from the specified database based on search criteria.
	 */
	async remove(query: VQueryT.Remove) {
		this._validateTransaction(query);
		const { collection } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(query.collection);

		return await this.utils.operationUpdater(
			this._getCollectionPath(collection),
			this.fileCpu.remove.bind(this.fileCpu),
			false,
			query,
			this._getOpts(),
		);
	}

	/**
	 * Remove the first matching entry from the specified database based on search criteria.
	 */
	async removeOne(query: VQueryT.Remove) {
		this._validateTransaction(query);
		const { collection } = query;
		this._ensureQueryFormat(query);

		await this.ensureCollection(query.collection);

		const res = await this.utils.operationUpdater(
			this._getCollectionPath(collection),
			this.fileCpu.remove.bind(this.fileCpu),
			true,
			query,
			this._getOpts(),
		);

		return res[0] ?? null;
	}

	/**
	 * Removes a database collection from the file system.
	 */
	async removeCollection(collection: string) {
		await promises.rm(join(this.folder, collection), {
			recursive: true,
			force: true,
		});
		return true;
	}

	async beginTransaction(id: Id): Promise<TransactionHandle> {
		if (this.activeTx) throw new Error("transaction already active");
		if (this.journal.isPoisoned()) {
			throw new Error(
				"journal is poisoned from previous failed commit, cannot begin new transaction",
			);
		}
		const handle: TransactionHandle = {
			id,
		};
		this.journal.begin();
		this.activeTx = handle;
		return handle;
	}

	async commitTransaction(handle: TransactionHandle) {
		if (!this.activeTx || this.activeTx.id !== handle.id) {
			throw new Error("transaction handle mismatch");
		}
		try {
			await this.journal.commit();
		} catch (err) {
			this.activeTx = null;
			try {
				await this.journal.rollback();
			} catch {}
			this.journal.resetPoisoned();
			throw err;
		}
		this.activeTx = null;
	}

	async rollbackTransaction(handle: TransactionHandle) {
		if (!this.activeTx || this.activeTx.id !== handle.id) {
			throw new Error("transaction handle mismatch");
		}
		try {
			await this.journal.rollback();
		} catch (err) {
			this.activeTx = null;
			this.journal.resetPoisoned();
			throw err;
		}
		this.activeTx = null;
	}

	/**
	 * Recover from failed transaction state.
	 * Resets active transaction, performs rollback, and clears poisoned state.
	 */
	async recover() {
		this.activeTx = null;
		try {
			await this.journal.rollback();
		} catch {}
		this.journal.resetPoisoned();
	}
}
