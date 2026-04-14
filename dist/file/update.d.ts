import { UpdateQuery } from "@wxn0brp/db-core/types/query";
/**
 * Updates a file based on search criteria and an updater function or object.
 */
export declare function update(file: string, config: UpdateQuery, one: boolean): Promise<any[]>;
