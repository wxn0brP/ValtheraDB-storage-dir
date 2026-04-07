import { DbOpts } from "@wxn0brp/db-core/types/options";

declare module "@wxn0brp/db-core/types/query" {
    export interface VQuery_Control {
        dir?: {
            lastFileNum?: number;
            sortedFiles?: string[];
            format?: Format;
        }
    }
}

export type DbDirOpts = Omit<DbOpts, "dbAction"> & {
    maxFileSize?: number;
    format?: string | Format;
};

export interface Format {
    stringify: (data: any) => string;
    parse: (data: string) => any;
    init?: () => Promise<void>;
    _extended?: boolean;
}
