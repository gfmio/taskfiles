# V2 Architecture - Proof of Concept

This document describes the V2 architecture for self-contained, map-based tool configuration.

## Overview

The V2 architecture addresses several limitations of the V1 approach:

1. **Self-contained tools** - Each tool owns its detection logic + config + tasks
2. **Map-based configuration** - Clean `TOOL.property` syntax
3. **Native booleans** - No more string "true"/"false"
4. **Tri-state enable** - `null` = auto-detect, `true`/`false` = override
5. **Clean skip logic** - Uses `ternary` for boolean → exit code conversion

## File Structure

```
tools/
├── typescript-v2.yml    # Self-contained TypeScript tool
├── biome-v2.yml         # Self-contained Biome tool
└── ...                  # One file per tool

tools-v2.yml             # Aggregator (includes all v2 tools)
```

## Tool File Pattern

Each tool file follows this structure:

```yaml
version: "3"

vars:
  # ============================================================================
  # Configuration Map (User API)
  # ============================================================================

  TOOL_NAME:
    map:
      enabled: null          # Tri-state: null/true/false
      config_file: tool.json
      other_settings: value

  # ============================================================================
  # Detection (Shell Script)
  # ============================================================================

  _TOOL_NAME_DETECTED:
    sh: |
      test -f "{{.TOOL_NAME.config_file}}" && echo "1" && exit 0
      echo ""

  # ============================================================================
  # Computed Enable Flag (Template Logic)
  # ============================================================================

  ENABLE_TOOL_NAME: '{{if ne .TOOL_NAME.enabled nil}}{{.TOOL_NAME.enabled}}{{else}}{{not (empty ._TOOL_NAME_DETECTED)}}{{end}}'

tasks:
  tool:command:
    desc: Run tool command
    preconditions:
      - sh: 'exit {{ternary 0 1 .ENABLE_TOOL_NAME}}'
        msg: "Tool not enabled"
    cmds:
      - tool-command
```

## Key Innovations

### 1. String-Based Enable Flags with Shell Check

```yaml
preconditions:
  - sh: '[ -n "{{.ENABLE_TYPESCRIPT}}" ]'
    msg: "TypeScript not enabled"
```

**How it works:**
- `ENABLE_TYPESCRIPT` is computed by shell script, returns "1" (enabled) or "" (disabled)
- `[ -n "{{.ENABLE_TYPESCRIPT}}" ]` checks if string is non-empty
- If enabled (non-empty): test passes, task runs
- If disabled (empty): test fails, task skips with message

**Why not `ternary`?**
- Initially tried: `exit {{ternary 0 1 .ENABLE_TYPESCRIPT}}`
- Problem: Template `{{if}}` expressions return strings, not booleans
- `ternary` requires native boolean, errors on string "true"/"false"
- Solution: Shell script + string emptiness check

### 2. Tri-State Enable Logic

```yaml
TYPESCRIPT:
  map:
    enabled: null  # null = auto-detect
```

**States:**
- `null` - Use auto-detection (default)
- `true` - Force enable (even if not detected)
- `false` - Force disable (even if detected)

**Logic (Shell Script):**
```yaml
ENABLE_TOOL:
  sh: |
    ENABLED="{{.TOOL.enabled}}"
    if [ "$ENABLED" = "true" ]; then
      echo "1"  # Force enabled
    elif [ "$ENABLED" = "false" ]; then
      echo ""  # Force disabled
    else
      # Use detection (null case)
      [ -n "{{._TOOL_DETECTED}}" ] && echo "1" || echo ""
    fi
```

Translation: "If enabled is explicitly true/false, use it; otherwise use detection"

### 3. Map-Based Configuration

```yaml
TYPESCRIPT:
  map:
    enabled: null
    tsconfig: tsconfig.json
    src_dir: src
    out_dir: dist
```

**Access:**
- `{{.TYPESCRIPT.enabled}}`
- `{{.TYPESCRIPT.tsconfig}}`
- `{{.TYPESCRIPT.src_dir}}`

**Override from parent:**
```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: true
      tsconfig: tsconfig.build.json
```

### 4. Clean Configuration Syntax

```yaml
# Map-based configuration with native boolean
TYPESCRIPT:
  map:
    enabled: true  # Native boolean, not "true" string
    tsconfig: tsconfig.json

# Computed enable flag (string: "1" or "")
ENABLE_TYPESCRIPT:
  sh: |
    # Returns "1" or "" based on tri-state logic
    ...

# Use in preconditions
preconditions:
  - sh: '[ -n "{{.ENABLE_TYPESCRIPT}}" ]'
```

## Usage Examples

### Auto-Detection (Default)

```yaml
# Project Taskfile.yml
includes:
  tools-v2: { taskfile: .../tools-v2.yml, flatten: true }

# Auto-detects based on files present
tasks:
  build:
    cmds:
      - task: typescript:build  # Runs if detected
```

### Force Enable

```yaml
includes:
  tools-v2: { taskfile: .../tools-v2.yml, flatten: true }

vars:
  TYPESCRIPT:
    map:
      enabled: true  # Force enable
```

### Force Disable

```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: false  # Force disable
```

### Custom Configuration

```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: true
      tsconfig: tsconfig.build.json
      src_dir: lib
      out_dir: build
```

### Runtime Override

**Note:** CLI overrides of map properties are limited in Task. To override at runtime, use environment variables or Taskfile vars instead.

## Testing the PoC

```bash
# Run the demo
task -t Taskfile-v2-demo.yml info

# Test auto-detection
task -t Taskfile-v2-demo.yml demo:auto-detect

# Test force enable
task -t Taskfile-v2-demo.yml demo:force-enable

# Test force disable
task -t Taskfile-v2-demo.yml demo:force-disable

# Test custom config
task -t Taskfile-v2-demo.yml demo:custom-config
```

## Benefits Over V1

| Feature | V1 | V2 |
|---------|----|----|
| **Tool organization** | Centralized detection.yml | Self-contained per tool |
| **Configuration** | Flat `ENABLE_*` vars | Map-based `TOOL.*` |
| **Config values** | String "true"/"false" | Native bool `true`/`false` in config |
| **Enable flags** | String var | Shell-computed string ("1"/"") |
| **Override** | Set `ENABLE_TYPESCRIPT=true` | Set `TYPESCRIPT.enabled=true` in Taskfile |
| **Detection** | Separate file | Embedded in tool file |
| **Task skip** | String comparison | String emptiness check |
| **Maintainability** | Edit multiple files | Edit one file |
| **Discoverability** | Check detection.yml | Look at tool file |

## Migration Path

1. **Phase 1** - Proof of concept (this)
   - Create v2 versions alongside v1
   - Test in real projects
   - Gather feedback

2. **Phase 2** - Incremental adoption
   - One tool at a time
   - Keep v1 compatibility
   - Update docs

3. **Phase 3** - Deprecate v1
   - Warn on v1 usage
   - Provide migration guide
   - Set sunset date

4. **Phase 4** - Remove v1
   - Clean removal
   - Version 2.0.0
   - Pure v2 architecture

## Known Limitations

1. **Map merging** - Task doesn't deep-merge maps
   - Must re-specify entire map to override in Taskfile vars
   - Workaround: Use defaults with `| default`

2. **CLI overrides** - Cannot override nested map properties from CLI
   - `task foo TYPESCRIPT.enabled=true` doesn't work
   - Must override via Taskfile vars or environment variables
   - This is a Task limitation, not specific to V2

3. **String-based enable flags** - Had to use shell script for tri-state logic
   - Template-only solution (`{{if ne .VAR nil}}...`) produces strings, not booleans
   - Ternary function requires native booleans, not string "true"/"false"
   - Solution: Use shell script that returns "1" (enabled) or "" (disabled)
   - Preconditions check: `[ -n "{{.ENABLE_TOOL}}" ]`

## Future Enhancements

1. **Helper macros** - Reduce boilerplate
   ```yaml
   ENABLE_TOOL: '{{enableLogic .TOOL.enabled ._TOOL_DETECTED}}'
   ```

2. **Validation** - Required vars, type checking
   ```yaml
   preconditions:
     - validate: TYPESCRIPT.tsconfig exists
   ```

3. **Inheritance** - Tool presets
   ```yaml
   TYPESCRIPT:
     extends: typescript-lib-preset
     map:
       out_dir: custom  # Override one field
   ```

## Conclusion

The V2 architecture provides a cleaner, more maintainable foundation for polyglot task automation. The proof of concept validates:

✅ Self-contained tools work (detection + config + tasks in one file)
✅ Map-based config is clean (`TOOL.property` syntax)
✅ Tri-state logic works (null/true/false)
✅ Native booleans in config (input side)
✅ Shell-based enable flags work (output side)
✅ String emptiness checks provide clean task skipping

**Key Learnings:**
- Template-only approach produces strings, not booleans
- Shell scripts needed for tri-state computation
- String emptiness check (`[ -n "..." ]`) works well for preconditions
- CLI overrides of map properties don't work in Task (must use Taskfile vars)

Ready for incremental adoption!
