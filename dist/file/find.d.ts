import { FindOneQuery, FindQuery } from "@wxn0brp/db-core/types/query";
export declare function find(file: string, config: FindQuery): Promise<any[]>;
export declare function findOne(file: string, config: FindOneQuery): Promise<any | null>;
