let json5;
export const format = {
    json: {
        parse(data) {
            return JSON.parse(data);
        },
        stringify(data) {
            return JSON.stringify(data);
        }
    },
    json5: {
        parse(data) {
            return json5.parse(data);
        },
        stringify(data) {
            return json5.stringify(data);
        },
        async init() {
            if (json5)
                return;
            // @ts-ignore
            if (typeof Bun !== "undefined" && Bun?.JSON5 && !process?.env?.VALTHERA_DIR_DISABLE_BUN)
                json5 = Bun.JSON5;
            else {
                const imp = await import("json5");
                json5 = imp.default;
            }
        }
    },
};
export function extendJson(format) {
    if (format._extended)
        return format;
    return {
        ...format,
        _extended: true,
        parse(data) {
            if (data[0] !== "{")
                return format.parse(`{${data}}`);
            return format.parse(data);
        },
        stringify(data) {
            return format.stringify(data).slice(1, -1);
        }
    };
}
