import { FindOneQuery, FindQuery } from "@wxn0brp/db-core/types/query";
/**
 * Asynchronously finds entries in a file based on search criteria.
 */
export declare function find(file: string, config: FindQuery): Promise<any[]>;
/**
 * Asynchronously finds one entry in a file based on search criteria.
 */
export declare function findOne(file: string, config: FindOneQuery): Promise<any | false>;
