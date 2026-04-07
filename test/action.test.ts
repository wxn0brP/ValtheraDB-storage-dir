import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { FileActions } from "../src/action";
import { vFileCpu } from "../src/file";

const TEST_DIR = join(process.cwd(), "test_temp_actions");

describe("action.ts", () => {
    let actions: FileActions;

    beforeEach(async () => {
        await mkdir(TEST_DIR, { recursive: true });
        actions = new FileActions(TEST_DIR, { maxFileSize: 2 * 1024 * 1024 }, vFileCpu);
        await actions.init();
    });

    afterEach(async () => {
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    describe("init", () => {
        it("1. should create folder if it doesn't exist", async () => {
            const newDir = join(TEST_DIR, "new_folder");
            const newActions = new FileActions(newDir, {}, vFileCpu);
            await newActions.init();
            expect(await newActions.issetCollection("")).toBe(true);
        });

        it("2. should not fail if folder already exists", async () => {
            await actions.init();
            expect(await actions.init()).toBeUndefined();
        });
    });

    describe("getCollections", () => {
        it("1. should return empty array for empty folder", async () => {
            const collections = await actions.getCollections();
            expect(collections).toEqual([]);
        });

        it("2. should return collection names", async () => {
            await actions.ensureCollection("users");
            await actions.ensureCollection("posts");

            const collections = await actions.getCollections();
            expect(collections).toContain("users");
            expect(collections).toContain("posts");
        });

        it("3. should handle nested collections", async () => {
            await actions.ensureCollection("blog/posts");
            const collections = await actions.getCollections();
            expect(collections).toContain("blog/posts");
        });
    });

    describe("ensureCollection", () => {
        it("1. should create collection if it doesn't exist", async () => {
            const result = await actions.ensureCollection("test_collection");
            expect(result).toBe(true);
            expect(await actions.issetCollection("test_collection")).toBe(true);
        });

        it("2. should do nothing if collection already exists", async () => {
            await actions.ensureCollection("test_collection");
            const result = await actions.ensureCollection("test_collection");
            expect(result).toBeUndefined();
        });
    });

    describe("issetCollection", () => {
        it("1. should return true for existing collection", async () => {
            await actions.ensureCollection("test_collection");
            expect(await actions.issetCollection("test_collection")).toBe(true);
        });

        it("2. should return false for non-existing collection", async () => {
            expect(await actions.issetCollection("non_existing")).toBe(false);
        });
    });

    describe("add", () => {
        it("1. should add data to collection", async () => {
            const data = { name: "test", value: 123 };
            const result = await actions.add({
                collection: "test",
                data,
                control: {},
            });

            expect(result).toEqual(data);
            expect(await actions.issetCollection("test")).toBe(true);
        });

        it("2. should add id to data if not present", async () => {
            const data = { name: "test" };
            await actions.add({
                collection: "test",
                data,
                control: {},
            });

            const found = await actions.findOne({
                collection: "test",
                search: { name: "test" },
                context: {},
                control: {},
            });

            expect(found).toBeTruthy();
            expect(found?.name).toBe("test");
        });

        it("3. should preserve existing id", async () => {
            const data = { id: "custom_id", name: "test" };
            await actions.add({
                collection: "test",
                data,
                control: {},
            });

            const found = await actions.findOne({
                collection: "test",
                search: { id: "custom_id" },
                context: {},
                control: {},
            });

            expect(found?.id).toBe("custom_id");
        });
    });

    describe("find", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", name: "first" }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", name: "second" }, control: {} });
            await actions.add({ collection: "test", data: { id: "3", name: "third" }, control: {} });
        });

        it("1. should find all matching entries", async () => {
            const results = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(results.length).toBe(3);
        });

        it("2. should find entries matching search criteria", async () => {
            const results = await actions.find({
                collection: "test",
                search: { name: "first" },
                context: {},
                control: {},
            });
            expect(results.length).toBe(1);
            expect(results[0].name).toBe("first");
        });

        it("3. should return empty array for no matches", async () => {
            const results = await actions.find({
                collection: "test",
                search: { name: "nonexistent" },
                context: {},
                control: {},
            });
            expect(results).toEqual([]);
        });

        it("4. should handle function-based search", async () => {
            const results = await actions.find({
                collection: "test",
                search: (item: any) => item.id === "2",
                context: {},
                control: {},
            });
            expect(results.length).toBe(1);
            expect(results[0].id).toBe("2");
        });
    });

    describe("findOne", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", name: "first" }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", name: "second" }, control: {} });
        });

        it("1. should return first matching entry", async () => {
            const result = await actions.findOne({
                collection: "test",
                search: { name: "first" },
                context: {},
                control: {},
            });
            expect(result).toBeTruthy();
            expect(result?.name).toBe("first");
        });

        it("2. should return null for no matches", async () => {
            const result = await actions.findOne({
                collection: "test",
                search: { name: "nonexistent" },
                context: {},
                control: {},
            });
            expect(result).toBeNull();
        });

        it("3. should return null for empty collection", async () => {
            const result = await actions.findOne({
                collection: "empty",
                search: {},
                context: {},
                control: {},
            });
            expect(result).toBeNull();
        });
    });

    describe("update", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", name: "first", value: 100 }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", name: "second", value: 200 }, control: {} });
        });

        it("1. should update all matching entries", async () => {
            const results = await actions.update({
                collection: "test",
                search: {},
                updater: (item: any) => ({ ...item, updated: true }),
                context: {},
                control: {},
            });

            expect(results.length).toBe(2);

            const all = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(all.every((item: any) => item.updated === true)).toBe(true);
        });

        it("2. should update entries matching search criteria", async () => {
            const results = await actions.update({
                collection: "test",
                search: { id: "1" },
                updater: (item: any) => ({ ...item, value: 999 }),
                context: {},
                control: {},
            });

            expect(results.length).toBe(1);
            expect(results[0].value).toBe(999);
        });

        it("3. should support object updater", async () => {
            await actions.update({
                collection: "test",
                search: { id: "1" },
                updater: { value: 500 },
                context: {},
                control: {},
            });

            const result = await actions.findOne({
                collection: "test",
                search: { id: "1" },
                context: {},
                control: {},
            });

            expect(result?.value).toBe(500);
        });
    });

    describe("updateOne", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", value: 100 }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", value: 200 }, control: {} });
        });

        it("1. should update only first matching entry", async () => {
            const result = await actions.updateOne({
                collection: "test",
                search: {},
                updater: (item: any) => ({ ...item, updated: true }),
                context: {},
                control: {},
            });

            expect(result).toBeDefined();

            const all = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(all.filter((item: any) => item.updated === true).length).toBe(1);
        });

        it("2. should return updated entry", async () => {
            const result = await actions.updateOne({
                collection: "test",
                search: { id: "1" },
                updater: { value: 999 },
                context: {},
                control: {},
            });

            expect(result?.value).toBe(999);
        });
    });

    describe("remove", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", name: "first" }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", name: "second" }, control: {} });
            await actions.add({ collection: "test", data: { id: "3", name: "third" }, control: {} });
        });

        it("1. should remove all matching entries", async () => {
            const removed = await actions.remove({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });

            expect(removed.length).toBe(3);

            const remaining = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(remaining.length).toBe(0);
        });

        it("2. should remove entries matching search criteria", async () => {
            const removed = await actions.remove({
                collection: "test",
                search: { id: "1" },
                context: {},
                control: {},
            });

            expect(removed.length).toBe(1);
            expect(removed[0].id).toBe("1");

            const remaining = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(remaining.length).toBe(2);
        });
    });

    describe("removeOne", () => {
        beforeEach(async () => {
            await actions.add({ collection: "test", data: { id: "1", name: "first" }, control: {} });
            await actions.add({ collection: "test", data: { id: "2", name: "second" }, control: {} });
        });

        it("1. should remove only first matching entry", async () => {
            const removed = await actions.removeOne({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });

            expect(removed).toBeDefined();

            const remaining = await actions.find({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(remaining.length).toBe(1);
        });

        it("2. should return removed entry", async () => {
            const removed = await actions.removeOne({
                collection: "test",
                search: { id: "1" },
                context: {},
                control: {},
            });

            expect(removed?.id).toBe("1");
        });
    });

    describe("removeCollection", () => {
        beforeEach(async () => {
            await actions.ensureCollection("test");
            await actions.add({ collection: "test", data: { id: "1" }, control: {} });
        });

        it("1. should remove collection", async () => {
            const result = await actions.removeCollection("test");
            expect(result).toBe(true);
            expect(await actions.issetCollection("test")).toBe(false);
        });

        it("2. should remove all data in collection", async () => {
            await actions.removeCollection("test");
            const found = await actions.findOne({
                collection: "test",
                search: {},
                context: {},
                control: {},
            });
            expect(found).toBeNull();
        });
    });
});
