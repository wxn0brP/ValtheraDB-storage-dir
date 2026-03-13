import { RemoveQuery } from "@wxn0brp/db-core/types/query";
/**
 * Removes entries from a file based on search criteria.
 */
export declare function remove(file: string, config: RemoveQuery, one: boolean): Promise<any[]>;
