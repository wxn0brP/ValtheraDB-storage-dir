import { createFileActions } from "../src/index.js";

const TEST_DIR = "/tmp/valthera-e2e-dir-test";

export default async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
    const actions = createFileActions(TEST_DIR, { format: "json5:x" });
    await actions.init();
    actions._inited = true;
    return actions;
}
