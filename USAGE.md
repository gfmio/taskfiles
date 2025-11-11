# Usage Guide

Complete guide to using taskfiles with different configuration patterns.

## Table of Contents

1. [Variable Scoping Rules](#variable-scoping-rules)
2. [Usage Pattern 1: Auto-Detection (Default)](#usage-pattern-1-auto-detection-default)
3. [Usage Pattern 2: Manual Override](#usage-pattern-2-manual-override)
4. [Usage Pattern 3: Disable Auto-Detection](#usage-pattern-3-disable-auto-detection)
5. [Advanced Patterns](#advanced-patterns)

## Variable Scoping Rules

Task variables follow this priority order (highest to lowest):

1. **Task-level vars** - In the task definition itself
2. **CLI vars** - `task VAR=value taskname`
3. **Call vars** - When calling another task with `vars:`
4. **Parent Taskfile vars** - In the including/parent Taskfile ✨ **This is key!**
5. **Included Taskfile vars** - In the included Taskfile (detection.yml)
6. **Environment variables** - Shell environment

This means: **Parent always overrides included files!**

## Usage Pattern 1: Auto-Detection (Default)

The simplest approach - just include `all.yml` and let detection handle everything.

### Project Taskfile.yml

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
      - task --list-all
```

**For local development:**

```yaml
version: "3"

vars:
  TASKFILES_BASE_URL: ./path/to/local/taskfiles

includes:
  all:
    taskfile: "{{.TASKFILES_BASE_URL}}/all.yml"
    flatten: true
```

**Advanced: Include individually for more control:**

```yaml
includes:
  detection:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/presets/detection.yml
  tools:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/tools.yml
    flatten: true
  logical:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/logical.yml
    flatten: true
```

### What Happens

- `detection.yml` scans your project for config files
- Sets `ENABLE_*` variables based on what it finds
- Tool tasks use these variables to decide whether to run
- Everything "just works" with zero configuration

### Example

```bash
# See what was detected
task detection:info

# Run linting (only runs tools that were detected)
task lint

# TypeScript project with Biome → runs biome:check
# Python project with Ruff → runs ruff:check
# Both → runs both!
```

## Usage Pattern 2: Manual Override

Override specific detections while keeping auto-detection for everything else.

### Project Taskfile.yml

```yaml
version: "3"

includes:
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true

vars:
  # Override specific detections
  ENABLE_TYPESCRIPT: true   # Force enable even if not detected
  ENABLE_PYTHON: false      # Force disable even if detected
  ENABLE_BIOME: true        # Force enable Biome

  # All other ENABLE_* vars use auto-detection

tasks:
  default:
    cmds:
      - task --list-all
```

### Why This Works

Because parent Taskfile vars have **higher priority** than included Taskfile vars, your manual settings override the detection logic.

### Use Cases

- **Force enable during migration**: Enable tools before config files exist
- **Disable problematic tools**: Turn off specific tools that cause issues
- **Testing**: Test tasks with different tool combinations
- **CI optimization**: Explicitly set what you know is available

### Example

```bash
# Your overrides take effect
task detection:info
# Shows: ENABLE_TYPESCRIPT: true (even without tsconfig.json)
#        ENABLE_PYTHON: false (even with pyproject.toml)

# Run with your custom configuration
task lint
# Only runs TypeScript tools, skips Python tools
```

## Usage Pattern 3: Disable Auto-Detection

Turn off all auto-detection and manually specify everything.

### Project Taskfile.yml

```yaml
version: "3"

includes:
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true

vars:
  # Kill switch: disable all auto-detection
  AUTO_DETECT: false

  # Manually specify what you want
  ENABLE_TYPESCRIPT: true
  ENABLE_BIOME: true
  ENABLE_VITEST: true

  # Everything not listed is disabled

tasks:
  default:
    cmds:
      - task --list-all
```

### Why This Works

When `AUTO_DETECT: false`, all detection shell scripts in `detection.yml` short-circuit and return "false". Only your explicitly set variables take effect.

### Use Cases

- **Maximum control**: You know exactly what runs
- **Performance**: Skip detection shell scripts
- **Reproducibility**: Explicit is better than implicit
- **CI/CD**: Consistent behavior regardless of environment

### Example

```bash
task detection:info
# Shows: Auto-detection: false
#        ENABLE_TYPESCRIPT: true
#        ENABLE_BIOME: true
#        ENABLE_VITEST: true
#        ENABLE_* (everything else): false

task lint
# Only runs biome:check, nothing else
```

## Advanced Patterns

### Pattern 4: Environment Variable Override

Use environment variables for per-invocation overrides:

```bash
# Temporarily enable a tool
ENABLE_ESLINT=true task lint

# Disable auto-detection for one run
AUTO_DETECT=false task lint
```

### Pattern 5: Per-Task Override

Override for specific task calls:

```yaml
tasks:
  lint:strict:
    desc: Run linting with all tools enabled
    cmds:
      - task: lint
        vars:
          ENABLE_BIOME: true
          ENABLE_ESLINT: true
          ENABLE_PRETTIER: true
```

### Pattern 6: Local Development Override

Check for local taskfiles automatically:

```yaml
vars:
  TASKFILES_BASE_URL:
    sh: |
      # Use local copy if available
      if [ -d "./vendor/taskfiles" ]; then
        echo "./vendor/taskfiles"
      elif [ -d "../taskfiles" ]; then
        echo "../taskfiles"
      elif [ -n "${TASKFILES_BASE_URL}" ]; then
        echo "${TASKFILES_BASE_URL}"
      else
        echo "https://raw.githubusercontent.com/gfmio/taskfiles/main"
      fi
```

Then during development:

```bash
# Clone taskfiles locally
git clone https://github.com/gfmio/taskfiles vendor/taskfiles

# Taskfile automatically uses local copy
task lint

# Or override via environment
export TASKFILES_BASE_URL="../my-fork-of-taskfiles"
task lint
```

### Pattern 7: Conditional Includes

Only include what you need:

```yaml
version: "3"

vars:
  USE_TYPESCRIPT: '{{.USE_TYPESCRIPT | default "true"}}'
  USE_PYTHON: '{{.USE_PYTHON | default "false"}}'

includes:
  detection:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/presets/detection.yml

  # Conditionally include TypeScript tools
  tools-ts:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/tools.yml
    flatten: true
    optional: true
    # Only loads if USE_TYPESCRIPT is true

  # Conditionally include Python tools
  tools-py:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/tools/python.yml
    flatten: true
    optional: true
```

## Quick Reference

### Common Override Variables

```yaml
vars:
  # Master switches
  AUTO_DETECT: false          # Disable all auto-detection

  # Languages
  ENABLE_TYPESCRIPT: true     # TypeScript support
  ENABLE_PYTHON: true         # Python support
  ENABLE_RUST: true           # Rust support
  ENABLE_GO: true             # Go support

  # TypeScript/JS Tools
  ENABLE_BIOME: true          # Biome linter/formatter
  ENABLE_ESLINT: true         # ESLint linter
  ENABLE_PRETTIER: true       # Prettier formatter
  ENABLE_TSC: true            # TypeScript compiler
  ENABLE_VITEST: true         # Vitest test framework

  # Python Tools
  ENABLE_RUFF: true           # Ruff linter/formatter
  ENABLE_MYPY: true           # mypy type checker
  ENABLE_PYTEST: true         # pytest test framework

  # Universal Tools
  ENABLE_GIT: true            # Git tasks
  ENABLE_COMMITLINT: true     # Commit message linting
  ENABLE_MARKDOWNLINT: true   # Markdown linting
```

### Debugging Variables

```bash
# See all detected configuration
task detection:info

# See all available tasks
task --list-all

# Dry run to see what would execute
task --dry lint

# Verbose output
task --verbose lint
```

## Best Practices

1. **Start with auto-detection** - Let it work for you
2. **Override sparingly** - Only when necessary
3. **Document overrides** - Comment why you're overriding
4. **Use info task** - Verify your configuration with `task detection:info`
5. **Test locally** - Use local taskfiles during development
6. **Pin versions** - Use git tags in production (e.g., `/v1/` not `/main/`)

## Summary

| Pattern | AUTO_DETECT | ENABLE_* Vars | Use Case |
|---------|-------------|---------------|----------|
| **Auto-detection** | true (default) | Not set | Zero config, just works |
| **Manual override** | true (default) | Some set | Fine-tune specific tools |
| **Fully manual** | false | All set | Maximum control |
| **Env override** | Either | CLI vars | Per-invocation changes |

The key insight: **Parent Taskfile vars always win**, so you can override anything from detection.yml simply by setting it in your project's Taskfile.yml!
