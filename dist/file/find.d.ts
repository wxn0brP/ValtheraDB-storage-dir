import { VQueryT } from "@wxn0brp/db-core/types/query";
export declare function find(file: string, config: VQueryT.Find): Promise<any[]>;
export declare function findOne(file: string, config: VQueryT.FindOne): Promise<any | null>;
