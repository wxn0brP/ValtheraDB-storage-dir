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

export function extendJson(format: Format): Format {
    if (format._extended) return;

    return {
        ...format,
        _extended: true,
        parse(data: string) {
            if (data[0] !== "{") return format.parse(`{${data}}`);
            return format.parse(data);
        },
        stringify(data: any) {
            return format.stringify(data).slice(1, -1);
        }
    }
}
