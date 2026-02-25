import { existsSync, promises as fsPromises, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { findOne } from "../src/file/find";

const BENCHMARK_DIR = "benchmark_temp_large";
const DATA_FILE = join(BENCHMARK_DIR, "large_data.txt");
const NUM_ENTRIES = 2_000_000;

async function setup() {
    console.log("Setting up large benchmark environment...");
    if (existsSync(BENCHMARK_DIR)) {
        rmSync(BENCHMARK_DIR, { recursive: true, force: true });
    }
    await fsPromises.mkdir(BENCHMARK_DIR);

    console.time("Data generation time");
    console.log(`Generating ${NUM_ENTRIES} entries...`);

    const stream = (await fsPromises.open(DATA_FILE, "w")).createWriteStream();
    const BATCH_SIZE = 10000;
    let buffer = "";

    for (let i = 0; i < NUM_ENTRIES; i++) {
        buffer += JSON.stringify({ id: i, name: `Entry ${i}`, timestamp: Date.now() }) + "\n";

        if (i > 0 && i % BATCH_SIZE === 0) {
            if (!stream.write(buffer)) {
                await new Promise<void>(resolve => stream.once('drain', resolve));
            }
            buffer = "";
        }
    }

    if (buffer.length > 0) {
        if (!stream.write(buffer)) {
            await new Promise<void>(resolve => stream.once('drain', resolve));
        }
    }

    stream.end();
    await new Promise<void>(resolve => stream.on('finish', resolve));

    console.timeEnd("Data generation time");
    console.log("Setup complete.");
}

await setup();

const searchQueries = [
    {
        description: "Find first entry (id: 0)",
        search: { id: 0 },
    },
    {
        description: "Find (id: 100,000)",
        search: { id: 100_000 },
    },
    {
        description: "Find middle entry (id: 1,000,000)",
        search: { id: 1_000_000 },
    },
    {
        description: "Find last entry (id: 1,999,999)",
        search: { id: 1_999_999 },
    }
];

const results = [];

for (const query of searchQueries) {
    console.log(`\nRunning: ${query.description}`);
    const startTime = performance.now();
    const result = await findOne(DATA_FILE, { id: query.search.id });
    const endTime = performance.now();
    const duration = endTime - startTime;

    results.push({
        "Test Case": query.description,
        "Duration (ms)": duration.toFixed(2),
        "Duration (s)": (duration / 1000).toFixed(2),
        "Result Found": result ? "Yes" : "No",
    });
}

console.log("\n--- Benchmark Results ---");
console.table(results);

// Save results to file
const isBun = typeof process.versions?.bun !== "undefined";
const benchmarkResults = {
    timestamp: new Date().toISOString(),
    runtime: isBun ? "bun" : "node",
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    results: results
};
const runtimeSuffix = isBun ? "bun" : `node_${process.version.match(/v(\d+)/)?.[1] || "node"}`;
const resultsFileName = `benchmark_results_${runtimeSuffix}.json`;
writeFileSync(resultsFileName, JSON.stringify(benchmarkResults, null, 2));

console.log(`\nBenchmark results saved to ${resultsFileName}`);

console.log("\nCleaning up benchmark environment...");
rmSync(BENCHMARK_DIR, { recursive: true, force: true });
console.log("Cleanup complete.");
