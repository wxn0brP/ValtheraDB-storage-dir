import { WriteStream } from "fs";
import { FileCpuOpts } from "../types.js";
/**
 * Files above this size are processed with the streaming fallback to keep
 * memory bounded. Regular shards are capped by `maxFileSize` (2 MB default).
 */
export declare const BUFFER_LIMIT: number;
export interface LineReader extends AsyncIterable<string> {
    close: () => void;
}
export declare function createRL(file: string, delimiter: string): LineReader;
export declare function getDelimiter(opts: FileCpuOpts): string;
export declare function getDelimiterBuffer(opts: FileCpuOpts): Buffer<ArrayBuffer>;
export declare function splitBlocks(buffer: Buffer, delimiter: Buffer): Buffer[];
export declare function readBlocks(file: string, opts: FileCpuOpts): Promise<Buffer<ArrayBufferLike>[]>;
export declare function tmpPath(file: string): string;
export declare function endStream(ws: WriteStream): Promise<void>;
export declare function writeUpdateResult(file: string, data: Buffer, opts: FileCpuOpts): Promise<void>;
