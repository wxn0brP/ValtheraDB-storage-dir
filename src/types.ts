import { DbOpts } from "@wxn0brp/db-core/types/options";

declare module "@wxn0brp/db-core/types/query" {
    export interface VQuery_Control {
        dir?: {
            lastFileNum?: number;
            sortedFiles?: string[];
        }
    }
}

export type DbDirOpts = Omit<DbOpts, "dbAction"> & {
    maxFileSize?: number;
    format?: string | Format;
    delimiter?: string;
    stringifyArgs?: any[];
};

export interface Format {
    stringify: (data: any, opts: DbDirOpts) => string;
    parse: (data: string, opts: DbDirOpts) => any;
    init?: () => Promise<void>;
    delimiter?: string;
    _extended?: boolean;
}

export interface FileCpuOpts {
    format: Format;
    opts: DbDirOpts;
}
