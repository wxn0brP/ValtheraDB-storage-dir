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
            if (!json5)
                json5 = await import("json5");
        }
    },
};
export function extendJson(format) {
    if (format._extended)
        return;
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
