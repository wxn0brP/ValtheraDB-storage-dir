import json5 from "json5";
export function parseData(data) {
    if (data[0] !== "{")
        return json5.parse(`{${data}}`);
    return json5.parse(data);
}
export function stringifyData(data) {
    return json5.stringify(data);
}
