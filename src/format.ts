import { Format } from "./types";

let json5: typeof import("json5") | undefined;

export const format: Record<string, Format> = {
    json: {
        parse(data: string) {
            return JSON.parse(data);
        },
        stringify(data: any) {
            return JSON.stringify(data);
        }
    },
    json5: {
        parse(data: string) {
            return json5.parse(data);
        },
        stringify(data: any) {
            return json5.stringify(data);
        },
        async init() {
            if (!json5) json5 = await import("json5");
        }
    },
}

export function extendJson(format: Format) {
    if (format._extended) return;
    format._extended = true;

    const originalParseData = format.parse.bind(format);
    const originalStringifyData = format.stringify.bind(format);

    format.parse = (data: string) => {
        if (data[0] !== "{") return originalParseData(`{${data}}`);
        return originalParseData(data);
    }

    format.stringify = (data: any) => {
        return originalStringifyData(data).slice(1, -1);
    }
}
