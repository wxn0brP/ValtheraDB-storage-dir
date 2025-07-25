import json5 from "json5";

/**
 * Parses given string into a JSON object. If the string does not start with
 * a {, it is wrapped in one. This allows for a shorthand when
 * storing/reading data from a file.
 */
export function parseData(data: string) {
    if (!data.startsWith("{")) data = "{" + data + "}";
    return json5.parse(data);
}

/**
 * Converts given object to a string. If the string is a valid json5, it is
 * returned as is. If it is a valid json5 wrapped in {}, the curly brackets
 * are removed. Otherwise the string is wrapped in {}.
 */
export function stringifyData(data: any) {
    data = json5.stringify(data);
    if (data.startsWith("{")) {
        data = data.slice(1, -1);
    }
    return data;
}
