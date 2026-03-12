import { describe, expect, it } from "bun:test";
import { parseData, stringifyData } from "../src/format";

describe("format.ts", () => {
    describe("parseData", () => {
        it("1. should parse complete JSON object", () => {
            const data = '{"name":"test","value":123}';
            const result = parseData(data);
            expect(result).toEqual({ name: "test", value: 123 });
        });

        it("2. should parse JSON without outer braces", () => {
            const data = '"name":"test","value":456';
            const result = parseData(data);
            expect(result).toEqual({ name: "test", value: 456 });
        });

        it("3. should parse JSON5 with unquoted keys", () => {
            const data = 'name: "test", value: 789';
            const result = parseData(data);
            expect(result).toEqual({ name: "test", value: 789 });
        });

        it("4. should parse JSON5 with trailing commas", () => {
            const data = '{"items": [1, 2, 3,], "count": 3}';
            const result = parseData(data);
            expect(result).toEqual({ items: [1, 2, 3], count: 3 });
        });

        it("5. should parse JSON5 with comments", () => {
            const data = '{// comment\n"name": "test"}';
            const result = parseData(data);
            expect(result).toEqual({ name: "test" });
        });

        it("6. should parse nested objects", () => {
            const data = '{"user":{"name":"John","age":30}}';
            const result = parseData(data);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
        });

        it("7. should parse arrays", () => {
            const data = '{"arr":[1,2,3,"test"]}';
            const result = parseData(data);
            expect(result).toEqual({ arr: [1, 2, 3, "test"] });
        });
    });

    describe("stringifyData", () => {
        it("1. should stringify object without outer braces", () => {
            const data = { name: "test", value: 123 };
            const result = stringifyData(data);
            expect(result).toContain("name:");
            expect(result).toContain("test");
            expect(result).toContain("value:");
            expect(result).toContain("123");
        });

        it("2. should stringify nested object", () => {
            const data = { user: { name: "John", age: 30 } };
            const result = stringifyData(data);
            expect(result).toContain("user:");
            expect(result).toContain("name:");
        });

        it("3. should stringify array", () => {
            const data = { items: [1, 2, 3] };
            const result = stringifyData(data);
            expect(result).toContain("items:");
            expect(result).toContain("[1,2,3]");
        });

        it("4. should handle special characters in strings", () => {
            const data = { text: "hello\nworld" };
            const result = stringifyData(data);
            expect(result).toContain("hello");
        });

        it("5. should handle empty object", () => {
            const data = {};
            const result = stringifyData(data);
            expect(result).toBe("");
        });

        it("6. roundtrip: parseData(stringifyData(data)) should equal original data", () => {
            const originalData = { name: "test", value: 42, nested: { x: 1 } };
            const stringified = stringifyData(originalData);
            const parsed = parseData(stringified);
            expect(parsed).toEqual(originalData);
        });
    });
});
