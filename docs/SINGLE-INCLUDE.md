# Single Include Pattern (`all.yml`)

This document explains the `all.yml` file and the single-include pattern for maximum simplicity.

## Why `all.yml`?

Instead of requiring users to include three separate files:

```yaml
includes:
  detection: { taskfile: .../detection.yml }
  tools: { taskfile: .../tools.yml, flatten: true }
  logical: { taskfile: .../logical.yml, flatten: true }
```

Users can now include just one:

```yaml
includes:
  all: { taskfile: .../all.yml, flatten: true }
```

## How It Works

The `all.yml` file is a **meta-include** that internally includes:

1. `presets/detection.yml` - Auto-detection (not flattened)
2. `tools.yml` - All tool tasks (flattened)
3. `logical.yml` - All workflow tasks (flattened)

When you include `all.yml` with `flatten: true`, the structure looks like:

```
your-project/
└── all: (flattened)
    ├── detection: (not flattened)
    │   └── info
    ├── biome:check
    ├── biome:format
    ├── lint
    ├── lint:fix
    └── ...
```

Result: `detection:info`, `biome:check`, `lint`, etc. - no extra nesting!

## Usage Examples

### Minimal Example

```yaml
version: "3"

includes:
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true
```

### With Local Development

```yaml
version: "3"

vars:
  TASKFILES_BASE_URL: ./vendor/taskfiles

includes:
  all:
    taskfile: "{{.TASKFILES_BASE_URL}}/all.yml"
    flatten: true
```

### With Manual Overrides

```yaml
version: "3"

includes:
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true

vars:
  # Override auto-detection
  ENABLE_TYPESCRIPT: true
  ENABLE_BIOME: true
  ENABLE_PYTHON: false
```

### With Auto-Detection Disabled

```yaml
version: "3"

includes:
  all:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/all.yml
    flatten: true

vars:
  # Disable all auto-detection
  AUTO_DETECT: false

  # Manually enable specific tools
  ENABLE_BIOME: true
  ENABLE_VITEST: true
```

## Why Flatten `all.yml`?

If you don't flatten:

```yaml
includes:
  taskfiles:  # <-- namespace
    taskfile: .../all.yml
```

You get double nesting:
- `taskfiles:detection:info`
- `taskfiles:biome:check`
- `taskfiles:lint`

With flatten:

```yaml
includes:
  all:
    taskfile: .../all.yml
    flatten: true  # <-- merge into parent
```

You get clean names:
- `detection:info`
- `biome:check`
- `lint`

## Advanced: Individual Includes

For more control, you can still include individually:

```yaml
includes:
  # Don't flatten detection to avoid conflicts
  detection:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/presets/detection.yml

  # Flatten tools and workflows
  tools:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/tools.yml
    flatten: true

  logical:
    taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/main/logical.yml
    flatten: true
```

This gives you the flexibility to:
- Include only what you need
- Use different flatten settings
- Add custom namespaces

## Comparison

| Pattern | Lines | Clarity | Flexibility |
|---------|-------|---------|-------------|
| `all.yml` | 3 | ⭐⭐⭐ | ⭐⭐ |
| Individual includes | 9 | ⭐⭐ | ⭐⭐⭐ |

**Recommendation**: Use `all.yml` for 99% of projects. Only use individual includes if you need fine-grained control over what's included.

## Implementation Details

The `all.yml` file is simple:

```yaml
version: "3"

includes:
  detection:
    taskfile: ./presets/detection.yml
    # Not flattened - keeps detection:info separate

  tools:
    taskfile: ./tools.yml
    flatten: true

  logical:
    taskfile: ./logical.yml
    flatten: true
```

It's just a wrapper that aggregates the three core includes. No magic!

## Benefits

1. **Simpler onboarding** - One line to include everything
2. **Fewer errors** - Can't forget to include detection or tools
3. **Cleaner Taskfiles** - 3 lines instead of 9
4. **Still flexible** - Can override any variable
5. **Optional** - Power users can still use individual includes

## Related Documentation

- [USAGE.md](../USAGE.md) - Complete usage patterns
- [README.md](../README.md) - Getting started guide
- [detection.yml](../presets/detection.yml) - Auto-detection implementation
