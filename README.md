# ValtheraDB Dir Storage

This plugin provides directory-based operations for ValtheraDB.

## Installation

```bash
npm install @wxn0brp/db-storage-dir json5
```

## Usage

```typescript
import { createFileActions } from "@wxn0brp/db-storage-dir";

const actions = createFileActions("dir", {
    format: "json5:x", // or json, json:x, json5
})
```

## Benchmark

Performance benchmarks are available on the [`benchmark`](https://github.com/wxn0brP/ValtheraDB-storage-dir/tree/benchmark) branch.

## License

MIT
