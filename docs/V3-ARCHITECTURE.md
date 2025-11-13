# V3 Architecture - The Working Solution

## Summary

V3 architecture solves the parent-override problem discovered in V2 using **Sprig's `merge` function** and a **two-tier variable pattern**.

## The Problem (from V2)

V2 failed because **Task gives precedence to included file's vars** over parent file's vars. When both parent and child define the same variable, the child's definition wins.

## The Solution

Use a two-tier pattern:

1. **Child defines defaults**: `TOOL_defaults`
2. **Parent defines overrides**: `TOOL`
3. **Child merges them**: `merge .TOOL_defaults .TOOL`

The key insight: **Child must NOT define `TOOL`** - only `TOOL_defaults`. This allows parent's `TOOL` to exist without being shadowed.

## File Pattern

### Tool File (Child)

```yaml
# tools/typescript-v3.yml
version: "3"

vars:
  # Defaults (child-defined)
  TYPESCRIPT_defaults:
    map:
      enabled: ""  # auto-detect
      tsconfig: tsconfig.json
      src_dir: src
      out_dir: dist

  # DON'T define TYPESCRIPT here!
  # Let parent define it

  # Detection
  _TYPESCRIPT_DETECTED:
    sh: test -f tsconfig.json && echo "1" || echo ""

  # Enable flag using merged config
  ENABLE_TYPESCRIPT:
    sh: |
      ENABLED='{{(merge .TYPESCRIPT_defaults .TYPESCRIPT).enabled}}'
      if [ "$ENABLED" = "true" ]; then
        echo "1"
      elif [ "$ENABLED" = "false" ]; then
        echo ""
      else
        [ -n "{{._TYPESCRIPT_DETECTED}}" ] && echo "1" || echo ""
      fi

tasks:
  typescript:check:
    preconditions:
      - sh: '[ -n "{{.ENABLE_TYPESCRIPT}}" ]'
    cmds:
      - tsc --project {{(merge .TYPESCRIPT_defaults .TYPESCRIPT).tsconfig}} --noEmit

  typescript:info:
    cmds:
      - echo "Config: {{merge .TYPESCRIPT_defaults .TYPESCRIPT | toJson}}"
```

### Parent File (User Project)

```yaml
# Taskfile.yml
version: "3"

vars:
  # Override only what you need
  TYPESCRIPT:
    map:
      enabled: "false"  # force disable
      tsconfig: tsconfig.build.json  # custom path

includes:
  tools:
    taskfile: https://.../tools/typescript-v3.yml
    flatten: true
```

## How It Works

1. **Parent defines `TYPESCRIPT`**:
   ```yaml
   TYPESCRIPT:
     map:
       enabled: "false"
       tsconfig: tsconfig.build.json
   ```

2. **Child has `TYPESCRIPT_defaults`**:
   ```yaml
   TYPESCRIPT_defaults:
     map:
       enabled: ""
       tsconfig: tsconfig.json
       src_dir: src
       out_dir: dist
   ```

3. **Child merges them**:
   ```yaml
   {{merge .TYPESCRIPT_defaults .TYPESCRIPT | toJson}}
   ```

4. **Result**:
   ```json
   {
     "enabled": "false",           // from parent
     "tsconfig": "tsconfig.build.json",  // from parent
     "src_dir": "src",             // from defaults
     "out_dir": "dist"             // from defaults
   }
   ```

The `merge` function takes two maps and combines them, with the second map's values overriding the first.

## Benefits Over V2

| Feature | V2 (Failed) | V3 (Works) |
|---------|-------------|------------|
| **Parent override** | ❌ Doesn't work | ✅ Works with merge |
| **Variable pattern** | Single `TOOL` map | Two-tier: `TOOL_defaults` + `TOOL` |
| **Child defines** | `TOOL` (shadows parent) | `TOOL_defaults` (no shadowing) |
| **Merge mechanism** | Template logic (broken) | Sprig `merge` function |
| **Partial override** | ❌ Must specify all | ✅ Override only what you need |

## Usage Examples

### Auto-Detection (No Override)

```yaml
# Parent doesn't define TYPESCRIPT at all
# merge handles undefined gracefully - uses all defaults

includes:
  tools: { taskfile: .../typescript-v3.yml, flatten: true }

# Result: Auto-detection active, default paths
```

### Force Enable

```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: "true"

# Result: Force enabled, all other settings use defaults
```

### Custom Paths

```yaml
vars:
  TYPESCRIPT:
    map:
      tsconfig: tsconfig.build.json
      out_dir: build

# Result: Auto-detect enabled, custom paths, default src_dir
```

### Force Disable

```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: "false"

# Result: Disabled, preconditions block task execution
```

## Key Technical Details

### The `merge` Function

From Sprig documentation:
```
merge dest src1 src2 ...
```

Merges source maps into destination map. Later sources override earlier ones.

In our case:
```yaml
{{merge .TYPESCRIPT_defaults .TYPESCRIPT | toJson}}
```

- `TYPESCRIPT_defaults` = base
- `TYPESCRIPT` = overlay
- Result = combined with `TYPESCRIPT` values winning

### Handling Undefined Variables

If parent doesn't define `TYPESCRIPT`, it's undefined in the merge context. Sprig's `merge` treats undefined as an empty map `{}`, so:

```yaml
{{merge .TYPESCRIPT_defaults .TYPESCRIPT | toJson}}
# When TYPESCRIPT undefined:
# = merge TYPESCRIPT_defaults {}
# = TYPESCRIPT_defaults (all defaults used)
```

### Inline Merge Expressions

You can use merge directly in templates:

```yaml
cmds:
  - tsc --project {{(merge .TYPESCRIPT_defaults .TYPESCRIPT).tsconfig}}
```

The parentheses create a pipeline: merge the maps, then access the `tsconfig` property.

## Migration from V1

V1 (flat vars):
```yaml
vars:
  ENABLE_TYPESCRIPT: "true"
  TYPESCRIPT_TSCONFIG: "tsconfig.build.json"
```

V3 (map with defaults):
```yaml
vars:
  TYPESCRIPT:
    map:
      enabled: "true"
      tsconfig: "tsconfig.build.json"
```

Benefits:
- ✅ Namespaced (no `TYPESCRIPT_` prefix on every property)
- ✅ Hierarchical (properties grouped logically)
- ✅ Partial override (only specify what changes)
- ✅ Type-safe (maps vs flat strings)

## Limitations

1. **Child must not define `TOOL`** - Only define `TOOL_defaults`
   - If child defines `TOOL`, it shadows parent
   - This is a discipline requirement for tool authors

2. **No deep merge** - Only one level
   - `merge` is shallow
   - Can't have `TOOL.paths.input` and merge just `paths.output`
   - Workaround: Keep config flat or use multiple merge operations

3. **String "false" not boolean** - Still need string for enabled flag
   - Boolean `false` renders as empty in templates
   - Must use `enabled: "false"` not `enabled: false`
   - This is a Task/Go template limitation

## Testing

Test suite in `new3/`:

```bash
# Test parent override
task -t new3/parent-v3.yml test

# Test merge function
task -t new3/test-merge.yml test

# Test without parent override
task -t new3/typescript-v3.yml typescript:info
```

## Conclusion

V3 architecture **solves the parent-override problem** that blocked V2. The two-tier pattern with `merge` provides:

✅ Parent can override child defaults
✅ Partial overrides (only specify what changes)
✅ Clean map-based syntax
✅ Self-contained tool files
✅ Tri-state enable logic (auto/true/false)

**V3 is ready for implementation!**
