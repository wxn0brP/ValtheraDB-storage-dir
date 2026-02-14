import json5 from "json5";

export function parseData(data: string) {
    if (data[0] !== "{") return json5.parse(`{${data}}`);
    return json5.parse(data);
}

export function stringifyData(data: any) {
    return json5.stringify(data).slice(1, -1);
}
