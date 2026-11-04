import { createFileAdapter } from "../src/index.js";

const TEST_DIR = "/tmp/valthera-e2e-dir-test";

export default async () => {
	await Bun.$`rm -rf ${TEST_DIR}`.quiet();
	const adapter = createFileAdapter(TEST_DIR, {
		format: "json5:x",
	});
	await adapter.init();
	adapter._inited = true;
	return adapter;
};
