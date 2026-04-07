import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { vFileCpu } from "../src/file";
import { format } from "../src/format";

const TEST_DIR = join(process.cwd(), "test_temp_file_cpu");
const TEST_FILE = join(TEST_DIR, "test.db");

await format.json5.init();

describe("file CPU operations", () => {
    beforeEach(async () => {
        await mkdir(TEST_DIR, { recursive: true });
    });

    afterEach(async () => {
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    function getControl() {
        return {
            dir: {
                format: format.json5,
            }
        }
    }

    describe("add", () => {
        it("1. should append data to file", async () => {
            await writeFile(TEST_FILE, "");

            await vFileCpu.add(TEST_FILE, {
                collection: "test",
                data: { id: "1", name: "test" },
                control: getControl(),
            });

            const content = await Bun.file(TEST_FILE).text();
            expect(content.trim()).toContain("id:");
            expect(content.trim()).toContain("1");
            expect(content.trim()).toContain("name:");
            expect(content.trim()).toContain("test");
        });

        it("2. should add multiple entries on separate lines", async () => {
            await writeFile(TEST_FILE, "");

            await vFileCpu.add(TEST_FILE, {
                collection: "test",
                data: { id: "1" },
                control: getControl(),
            });

            await vFileCpu.add(TEST_FILE, {
                collection: "test",
                data: { id: "2" },
                control: getControl(),
            });

            const content = await Bun.file(TEST_FILE).text();
            const lines = content.trim().split("\n");
            expect(lines.length).toBe(2);
        });
    });

    describe("find", () => {
        beforeEach(async () => {
            await writeFile(TEST_FILE, '{"id":"1","name":"first"}\n{"id":"2","name":"second"}\n{"id":"3","name":"third"}\n');
        });

        it("1. should find all entries with empty search", async () => {
            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(results.length).toBe(3);
        });

        it("2. should find entries matching object search", async () => {
            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                context: {},
                control: getControl(),
            });

            expect(results.length).toBe(1);
            expect(results[0].name).toBe("first");
        });

        it("3. should find entries matching function search", async () => {
            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: (item: any) => item.id === "2",
                context: {},
                control: getControl(),
            });

            expect(results.length).toBe(1);
            expect(results[0].id).toBe("2");
        });

        it("4. should return empty array for no matches", async () => {
            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: { id: "nonexistent" },
                context: {},
                control: getControl(),
            });

            expect(results).toEqual([]);
        });

        it("5. should create file if it doesn't exist", async () => {
            const nonExistentFile = join(TEST_DIR, "nonexistent.db");
            const results = await vFileCpu.find(nonExistentFile, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(results).toEqual([]);
        });

        it("6. should handle empty lines in file", async () => {
            await writeFile(TEST_FILE, '{"id":"1"}\n\n{"id":"2"}\n');

            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(results.length).toBe(2);
        });
    });

    describe("findOne", () => {
        beforeEach(async () => {
            await writeFile(TEST_FILE, '{"id":"1","name":"first"}\n{"id":"2","name":"second"}\n');
        });

        it("1. should return first matching entry", async () => {
            const result = await vFileCpu.findOne(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                context: {},
                control: getControl(),
            });

            expect(result).toBeTruthy();
            expect((result as any)?.name).toBe("first");
        });

        it("2. should return false for no matches", async () => {
            const result = await vFileCpu.findOne(TEST_FILE, {
                collection: "test",
                search: { id: "nonexistent" },
                context: {},
                control: getControl(),
            });

            expect(result).toBe(false);
        });

        it("3. should return false for empty file", async () => {
            const emptyFile = join(TEST_DIR, "empty.db");
            await writeFile(emptyFile, "");

            const result = await vFileCpu.findOne(emptyFile, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(result).toBe(false);
        });

        it("4. should stop after first match", async () => {
            await writeFile(TEST_FILE, '{"id":"1","name":"first"}\n{"id":"1","name":"duplicate"}\n');

            const result = await vFileCpu.findOne(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                context: {},
                control: getControl(),
            });

            expect((result as any)?.name).toBe("first");
        });
    });

    describe("update", () => {
        beforeEach(async () => {
            await writeFile(TEST_FILE, '{"id":"1","value":100}\n{"id":"2","value":200}\n{"id":"3","value":300}\n');
        });

        it("1. should update all entries with empty search", async () => {
            const updated = await vFileCpu.update(TEST_FILE, {
                collection: "test",
                search: {},
                updater: (item: any) => ({ ...item, updated: true }),
                context: {},
                control: getControl(),
            }, false);

            expect(updated.length).toBe(3);

            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });
            expect(results.every((item: any) => item.updated === true)).toBe(true);
        });

        it("2. should update entries matching search criteria", async () => {
            const updated = await vFileCpu.update(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                updater: (item: any) => ({ ...item, value: 999 }),
                context: {},
                control: getControl(),
            }, false);

            expect(updated.length).toBe(1);
            expect(updated[0].value).toBe(999);
        });

        it("3. should support object updater", async () => {
            await vFileCpu.update(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                updater: { value: 500 },
                context: {},
                control: getControl(),
            }, false);

            const result = await vFileCpu.findOne(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                context: {},
                control: getControl(),
            });

            expect((result as any)?.value).toBe(500);
        });

        it("4. should update only first entry when one=true", async () => {
            await vFileCpu.update(TEST_FILE, {
                collection: "test",
                search: {},
                updater: (item: any) => ({ ...item, updated: true }),
                context: {},
                control: getControl(),
            }, true);

            const results = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(results.filter((item: any) => item.updated === true).length).toBe(1);
        });

        it("5. should return empty array for no matches", async () => {
            const updated = await vFileCpu.update(TEST_FILE, {
                collection: "test",
                search: { id: "nonexistent" },
                updater: (item: any) => ({ ...item, value: 999 }),
                context: {},
                control: getControl(),
            }, false);

            expect(updated).toEqual([]);
        });

        it("6. should create empty file if it doesn't exist", async () => {
            const nonExistentFile = join(TEST_DIR, "nonexistent.db");
            await vFileCpu.update(nonExistentFile, {
                collection: "test",
                search: {},
                updater: (item: any) => item,
                context: {},
                control: getControl(),
            }, false);

            expect(await Bun.file(nonExistentFile).text()).toBe("");
        });
    });

    describe("remove", () => {
        beforeEach(async () => {
            await writeFile(TEST_FILE, '{"id":"1","name":"first"}\n{"id":"2","name":"second"}\n{"id":"3","name":"third"}\n');
        });

        it("1. should remove all entries with empty search", async () => {
            const removed = await vFileCpu.remove(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            }, false);

            expect(removed.length).toBe(3);

            const remaining = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });
            expect(remaining.length).toBe(0);
        });

        it("2. should remove entries matching search criteria", async () => {
            const removed = await vFileCpu.remove(TEST_FILE, {
                collection: "test",
                search: { id: "1" },
                context: {},
                control: getControl(),
            }, false);

            expect(removed.length).toBe(1);
            expect(removed[0].id).toBe("1");

            const remaining = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });
            expect(remaining.length).toBe(2);
        });

        it("3. should remove only first entry when one=true", async () => {
            await vFileCpu.remove(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            }, true);

            const remaining = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });
            expect(remaining.length).toBe(2);
        });

        it("4. should return empty array for no matches", async () => {
            const removed = await vFileCpu.remove(TEST_FILE, {
                collection: "test",
                search: { id: "nonexistent" },
                context: {},
                control: getControl(),
            }, false);

            expect(removed).toEqual([]);

            const remaining = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });
            expect(remaining.length).toBe(3);
        });

        it("5. should preserve file structure after removal", async () => {
            await vFileCpu.remove(TEST_FILE, {
                collection: "test",
                search: { id: "2" },
                context: {},
                control: getControl(),
            }, false);

            const remaining = await vFileCpu.find(TEST_FILE, {
                collection: "test",
                search: {},
                context: {},
                control: getControl(),
            });

            expect(remaining.some((item: any) => item.id === "1")).toBe(true);
            expect(remaining.some((item: any) => item.id === "3")).toBe(true);
            expect(remaining.some((item: any) => item.id === "2")).toBe(false);
        });
    });
});
