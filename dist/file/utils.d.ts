import { FileCpuOpts } from "../types.js";
export interface LineReader extends AsyncIterable<string> {
    close: () => void;
}
export declare function createRL(file: string, delimiter: string): LineReader;
export declare function getDelimiter(opts: FileCpuOpts): string;
