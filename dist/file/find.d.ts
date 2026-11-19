import { VQueryT } from "@wxn0brp/db-core/types/query";
import { FileCpuOpts } from "../types.js";
export declare function find(file: string, config: VQueryT.Find, opts: FileCpuOpts): Promise<any[]>;
export declare function findOne(file: string, config: VQueryT.FindOne, opts: FileCpuOpts): Promise<any | null>;
