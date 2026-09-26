let json5;
let yaml;
export const format = {
    json: {
        parse(data) {
            return JSON.parse(data);
        },
        stringify(data, opts) {
            const args = opts.stringifyArgs || [];
            return JSON.stringify(data, ...args);
        },
    },
    json5: {
        parse(data) {
            return json5.parse(data);
        },
        stringify(data, opts) {
            const args = opts.stringifyArgs || [];
            return json5.stringify(data, ...args);
        },
        async init() {
            if (json5)
                return;
            // @ts-ignore
            if (typeof Bun !== "undefined" &&
                Bun?.JSON5 &&
                !process?.env?.VALTHERA_DIR_DISABLE_BUN)
                json5 = Bun.JSON5;
            else {
                const imp = await import("json5");
                json5 = imp.default;
            }
        },
    },
    yaml: {
        delimiter: "\n\n---\n\n",
        parse(data) {
            return yaml.parse(data);
        },
        stringify(data) {
            return yaml.stringify(data);
        },
        async init() {
            if (yaml)
                return;
            // @ts-ignore
            if (typeof Bun !== "undefined" &&
                Bun?.YAML &&
                !process?.env?.VALTHERA_DIR_DISABLE_BUN)
                yaml = Bun.YAML;
            else {
                const imp = await import("yaml");
                yaml = imp.default;
            }
        },
    },
};
export function extendJson(format) {
    if (format._extended)
        return format;
    return {
        ...format,
        _extended: true,
        parse(data, opts) {
            if (data[0] !== "{")
                return format.parse(`{${data}}`, opts);
            return format.parse(data, opts);
        },
        stringify(data, opts) {
            return format.stringify(data, opts).slice(1, -1);
        },
    };
}
