import { DbOpts } from "@wxn0brp/db-core/types/options";
declare module "@wxn0brp/db-core/types/query" {
    interface VQuery_Control {
        dir?: {
            lastFileNum?: number;
            sortedFiles?: string[];
        };
    }
}
export type DbDirOpts = Omit<DbOpts, "dbAction"> & {
    maxFileSize?: number;
};
