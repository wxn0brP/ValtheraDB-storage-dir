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
            if (json5) return;
            // @ts-ignore
            if (typeof Bun !== "undefined" && Bun?.JSON5 && !process?.env?.VALTHERA_DIR_DISABLE_BUN) json5 = Bun.JSON5;
            else {
                const imp = await import("json5");
                json5 = imp.default;
            }
        }
    },
}

export function extendJson(format: Format): Format {
    if (format._extended) return format;

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
