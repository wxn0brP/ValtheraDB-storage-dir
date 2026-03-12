import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { exists } from "../src/utils";

const TEST_DIR = join(process.cwd(), "test_temp_utils");

describe("utils.ts", () => {
    beforeEach(async () => {
        await mkdir(TEST_DIR, { recursive: true });
    });

    afterEach(async () => {
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    describe("exists", () => {
        it("1. should return true for existing directory", async () => {
            const result = await exists(TEST_DIR);
            expect(result).toBe(true);
        });

        it("2. should return true for existing file", async () => {
            const filePath = join(TEST_DIR, "test.txt");
            await writeFile(filePath, "test content");
            const result = await exists(filePath);
            expect(result).toBe(true);
        });

        it("3. should return false for non-existing path", async () => {
            const nonExistingPath = join(TEST_DIR, "non-existing-folder");
            const result = await exists(nonExistingPath);
            expect(result).toBe(false);
        });

        it("4. should return false for non-existing file in existing directory", async () => {
            const nonExistingFile = join(TEST_DIR, "non-existing.txt");
            const result = await exists(nonExistingFile);
            expect(result).toBe(false);
        });
    });
});
