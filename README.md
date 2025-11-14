# Taskfiles

> Reusable [Task](https://taskfile.dev) configurations for polyglot projects

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This repository provides modular, reusable Taskfile configurations that can be included in any project. It supports multiple programming languages and ecosystems (TypeScript, Python, Rust, Go) with automatic detection and activation.

## Features

- **Polyglot Support**: Works with TypeScript/JavaScript, Python, Rust, Go, and more
- **Auto-Detection**: Automatically detects project type and available tools
- **Modular Architecture**: Two-tier organization (tools + logical workflows)
- **Remote/Local Flexibility**: Use remote includes or local development copies
- **Feature Flags**: Enable/disable specific stacks and tools as needed
- **Zero Configuration**: Works out of the box with sensible defaults
- **Fully Customizable**: Override any variable or task behavior

## Quick Start

### Prerequisites

- [Task](https://taskfile.dev) v3.45.4 or later
- [Bun](https://bun.sh) (for TypeScript/JavaScript projects)

### Basic Usage

Add this to your project's `Taskfile.yml`:

```yaml
version: "3"

includes:
  # All-in-one include: detection + tools + logical workflows
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true

tasks:
  default:
    desc: Show available tasks
    cmds:
      - task --list
```

That's it! For local development, you can override the base URL:

```yaml
vars:
  TASKFILES_BASE_URL: ./path/to/local/taskfiles

includes:
  all:
    taskfile: "{{.TASKFILES_BASE_URL}}/all.yml"
    flatten: true
```

Now run:

```bash
# See what was detected
task info

# Run linting (works for any detected language)
task lint

# Fix linting issues
task lint:fix

# See all available tasks
task --list-all
```

## Architecture

### Directory Structure

```
taskfiles/
├── presets/          # Auto-detection and variable presets
│   └── detection.yml # Detects languages, tools, and frameworks
├── tools/            # Tool-specific tasks (biome, vitest, pytest, etc.)
│   └── biome.yml     # Example: Biome linter/formatter tasks
├── logical/          # High-level workflow tasks
│   └── lint.yml      # Example: Polyglot linting workflow
├── stacks/           # Pre-configured stacks (future)
├── tools.yml         # Aggregator for all tool taskfiles
├── logical.yml       # Aggregator for all logical taskfiles
└── Taskfile.yml      # Root taskfile for this repo
```

### Two-Tier Organization

**Tier 1: Tools** (`tools/`)
- Low-level, tool-specific commands
- Each tool gets its own file (e.g., `biome.yml`, `vitest.yml`)
- Controlled by `ENABLE_<TOOL>` variables
- Silently skip if not enabled

**Tier 2: Logical Workflows** (`logical/`)
- High-level, language-agnostic tasks
- Compose multiple tool tasks (e.g., `lint` runs biome/ruff/clippy based on detection)
- User-facing interface

## Configuration

### Three Usage Patterns

**1. Auto-Detection (Default)** - Just include and go:
```yaml
includes:
  detection: { taskfile: .../detection.yml }
  tools: { taskfile: .../tools.yml, flatten: true }
  logical: { taskfile: .../logical.yml, flatten: true }
```

**2. Manual Override** - Override specific detections:
```yaml
includes:
  detection: { taskfile: .../detection.yml }
  tools: { taskfile: .../tools.yml, flatten: true }
  logical: { taskfile: .../logical.yml, flatten: true }
vars:
  ENABLE_TYPESCRIPT: true  # Force enable
  ENABLE_PYTHON: false     # Force disable
```

**3. Fully Manual** - Disable auto-detection, set everything:
```yaml
includes:
  detection: { taskfile: .../detection.yml }
  tools: { taskfile: .../tools.yml, flatten: true }
  logical: { taskfile: .../logical.yml, flatten: true }
vars:
  AUTO_DETECT: false       # Disable all auto-detection
  ENABLE_BIOME: true       # Manually enable only what you want
```

**See [USAGE.md](USAGE.md) for complete documentation on variable scoping and configuration patterns.**

### Auto-Detection

The `presets/detection.yml` file automatically detects:

**Languages:**
- TypeScript (via `tsconfig.json` or `package.json`)
- JavaScript (via `package.json`)
- Python (via `pyproject.toml`, `setup.py`, or `requirements.txt`)
- Rust (via `Cargo.toml`)
- Go (via `go.mod`)

**Tools:**
- Biome, ESLint, Prettier, TSC, Vitest, Jest (TypeScript/JavaScript)
- Ruff, mypy, pytest (Python)
- Clippy, rustfmt (Rust)
- golangci-lint, gofmt (Go)
- Git, commitlint, lefthook, markdownlint, yamllint, etc. (Universal)

### Local Development

Use local taskfiles during development:

```bash
# Automatic detection (checks ./taskfiles, ../taskfiles, then remote)
task lint

# Or set explicitly
export TASKFILES_BASE_URL="./path/to/taskfiles"
task lint

# Or in Taskfile.yml
vars:
  TASKFILES_BASE_URL: ../taskfiles
```

### Variable Overrides

Customize paths and patterns:

```yaml
vars:
  # Override source directory
  SRC_DIR: lib  # default: src

  # Override file patterns
  SRC_TS_FILES: "lib/**/*.ts"  # default: src/**/*.ts

  # Override config file paths
  BIOME_CONFIG: custom-biome.json  # default: biome.json
```

## Available Tasks (Current)

### Detection

- `task info` - Display detected project configuration

### Linting (Polyglot)

- `task lint` - Run all linting checks
- `task lint:fix` - Fix all linting issues
- `task lint:fix:unsafe` - Fix with unsafe transformations (TypeScript only)
- `task lint:watch` - Run linting in watch mode
- `task lint:fix:watch` - Fix linting in watch mode

### Tool-Specific: Biome (TypeScript/JavaScript)

- `task biome:check` - Run Biome checks
- `task biome:check:write` - Run with auto-fix
- `task biome:check:unsafe` - Run with unsafe auto-fix
- `task biome:format` - Check formatting
- `task biome:format:write` - Format code
- `task biome:*:watch` - Watch mode variants

## Roadmap

See [GitHub Projects](https://github.com/gfmio/taskfiles/projects) for the full roadmap.

**Upcoming:**
- Additional TypeScript/JavaScript tools (vitest, tsc, eslint, prettier, etc.)
- Python toolchain (ruff, mypy, pytest)
- Rust toolchain (cargo, clippy, rustfmt)
- Go toolchain (go, golangci-lint)
- Logical workflows (test, build, format, ci, docs)
- Pre-configured stacks

## Development

### Setup

```bash
# Clone the repo
git clone https://github.com/gfmio/taskfiles.git
cd taskfiles

# Install dependencies
bun install

# Validate taskfiles
task validate

# See what's detected in this repo
task info
```

### Adding a New Tool

1. Create `tools/your-tool.yml` with:
   - `ENABLE_YOUR_TOOL` variable with default "false"
   - All tasks using `status` to check if enabled
   - Proper `sources` and `generates` for caching

2. Add include to `tools.yml`

3. Update `presets/detection.yml` with detection logic

4. Update logical workflows to use the new tool

5. Add tests and documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Each tool and logical workflow should be added in a separate PR for proper review and testing.

## License

[MIT](LICENSE) © Frédérique Mittelstaedt

## Resources

- [Task Documentation](https://taskfile.dev)
- [Task GitHub Repository](https://github.com/go-task/task)
- [Template TypeScript Library](https://github.com/gfmio/template-typescript-library) - Original inspiration
