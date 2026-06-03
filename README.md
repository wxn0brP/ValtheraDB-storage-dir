# ValtheraDB Dir Storage

This plugin provides directory-based operations for ValtheraDB.

## Installation

```bash
npm install @wxn0brp/db-storage-dir
```

Optional dependencies:

```bash
npm install json5 yaml
```

> **Note:** When running with Bun, native JSON5/YAML support is used automatically.
> Set `VALTHERA_DIR_DISABLE_BUN=1` to disable Bun's native JSON5/YAML and use the `json5`/`yaml` package instead.

## Formats

### JSON5

`json5`: Standard JSON5 format.
`json5:x`: Without `{}`

### JSON

`json`: Standard JSON format.
`json:x`: Without `{}`

### YAML

`yaml`: Standard YAML format.

## Usage

```typescript
import { createFileActions } from "@wxn0brp/db-storage-dir";

const actions = createFileActions("dir", {
    format: "json5:x",
})
```

## Benchmark

Performance benchmarks are available on the [`benchmark`](https://github.com/wxn0brP/ValtheraDB-storage-dir/tree/benchmark) branch.

## License

MIT
