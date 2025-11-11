# TypeScript Basic Example

This example demonstrates using taskfiles with a basic TypeScript project.

## Setup

```bash
cd examples/typescript-basic
bun install
```

## Usage

```bash
# See detected configuration
task info

# See all available tasks
task --list-all

# Run linting
task lint

# Fix linting issues
task lint:fix
```

## What Gets Detected

This project will detect:
- TypeScript (via `tsconfig.json` and `package.json`)
- Biome (via `biome.json` and `package.json`)

You can verify this with `task info`.
