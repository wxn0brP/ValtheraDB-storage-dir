import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { FileActionsUtils } from "../src/action.utils";

const TEST_DIR = join(process.cwd(), "test_temp_action_utils");

describe("action.utils.ts", () => {
    let utils: FileActionsUtils;

    beforeEach(async () => {
        utils = new FileActionsUtils();
        await mkdir(TEST_DIR, { recursive: true });
    });

    afterEach(async () => {
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    describe("getSortedFiles", () => {
        it("1. should return empty array for empty directory", async () => {
            const query = { control: {}, context: {} } as any;
            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual([]);
        });

        it("2. should return files sorted by number", async () => {
            await writeFile(join(TEST_DIR, "3.db"), "content3");
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "2.db"), "content2");

            const query = { control: {}, context: {} } as any;
            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual(["1.db", "2.db", "3.db"]);
        });

        it("3. should ignore non-.db files", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "test.txt"), "text");
            await writeFile(join(TEST_DIR, "data.json"), "{}");

            const query = { control: {}, context: {} } as any;
            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual(["1.db"]);
        });

        it("4. should ignore .tmp files", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "2.db.tmp"), "temp");

            const query = { control: {}, context: {} } as any;
            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual(["1.db"]);
        });

        it("5. should handle multi-digit file numbers correctly", async () => {
            await writeFile(join(TEST_DIR, "10.db"), "content10");
            await writeFile(join(TEST_DIR, "2.db"), "content2");
            await writeFile(join(TEST_DIR, "100.db"), "content100");

            const query = { control: {}, context: {} } as any;
            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual(["2.db", "10.db", "100.db"]);
        });

        it("6. should set sortedFiles in query.control.dir", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            const query = { control: {}, context: {} } as any;
            await utils.getSortedFiles(TEST_DIR, query);
            expect(query.control.dir.sortedFiles).toEqual(["1.db"]);
        });
    });

    describe("getLastFile", () => {
        const maxFileSize = 1024;

        it("1. should create directory and return 1.db for empty directory", async () => {
            const emptyDir = join(TEST_DIR, "empty");
            const query = { control: {}, context: {} } as any;
            const file = await utils.getLastFile(emptyDir, maxFileSize, query);
            expect(file).toBe("1.db");

            const files = await utils.getSortedFiles(emptyDir, query);
            expect(files).toEqual(["1.db"]);
        });

        it("2. should return last file if under max size", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "small content");
            const query = { control: {}, context: {} } as any;
            const file = await utils.getLastFile(TEST_DIR, maxFileSize, query);
            expect(file).toBe("1.db");
        });

        it("3. should create new file when last file exceeds max size", async () => {
            const largeContent = "x".repeat(maxFileSize + 100);
            await writeFile(join(TEST_DIR, "1.db"), largeContent);

            const query = { control: {}, context: { dir: {} } } as any;
            const file = await utils.getLastFile(TEST_DIR, maxFileSize, query);
            expect(file).toBe("2.db");

            const files = await utils.getSortedFiles(TEST_DIR, query);
            expect(files).toEqual(["1.db", "2.db"]);
        });

        it("4. should handle sequential file creation", async () => {
            const query = { control: {}, context: { dir: {} } } as any;

            await utils.getLastFile(TEST_DIR, maxFileSize, query);
            expect(await utils.getLastFile(TEST_DIR, maxFileSize, query)).toBe("1.db");

            await writeFile(join(TEST_DIR, "1.db"), "x".repeat(maxFileSize + 100));
            const result = await utils.getLastFile(TEST_DIR, maxFileSize, query);
            expect(result).toBe("2.db");
        });
    });

    describe("operationUpdater", () => {
        it("1. should call worker for each file", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "2.db"), "content2");

            const callOrder: string[] = [];
            const mockWorker: any = async (file: string) => {
                callOrder.push(file);
                return true;
            };

            const query = { control: {}, context: {}, search: {} } as any;
            await utils.operationUpdater(TEST_DIR, mockWorker, false, query);

            expect(callOrder.length).toBe(2);
            expect(callOrder[0]).toContain("1.db");
            expect(callOrder[1]).toContain("2.db");
        });

        it("2. should stop after first match when one=true", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "2.db"), "content2");

            const callOrder: string[] = [];
            const mockWorker: any = async (file: string) => {
                callOrder.push(file);
                return true;
            };

            const query = { control: {}, context: {}, search: {} } as any;
            await utils.operationUpdater(TEST_DIR, mockWorker, true, query);

            expect(callOrder.length).toBe(1);
            expect(callOrder[0]).toContain("1.db");
        });

        it("3. should continue when worker returns false", async () => {
            await writeFile(join(TEST_DIR, "1.db"), "content1");
            await writeFile(join(TEST_DIR, "2.db"), "content2");

            const callOrder: string[] = [];
            const mockWorker: any = async (file: string) => {
                callOrder.push(file);
                return false;
            };

            const query = { control: {}, context: {}, search: {} } as any;
            await utils.operationUpdater(TEST_DIR, mockWorker, false, query);

            expect(callOrder.length).toBe(2);
        });

        it("4. should return flattened results", async () => {
            const mockWorker: any = async (file: string) => {
                return [{ id: file }];
            };

            const query = { control: {}, context: {}, search: {} } as any;
            const result = await utils.operationUpdater(TEST_DIR, mockWorker, false, query);
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
