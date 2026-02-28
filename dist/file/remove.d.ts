import { Search } from "@wxn0brp/db-core/types/arg";
import { VContext } from "@wxn0brp/db-core/types/types";
/**
 * Removes entries from a file based on search criteria.
 */
export declare function remove(file: string, one: boolean, search: Search, context?: VContext): Promise<any[]>;
