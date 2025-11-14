# V2 Architecture - Lessons Learned

## Summary

The V2 architecture proof of concept revealed fundamental limitations in Task's variable system that make the proposed approach **not viable** as originally designed.

## What We Tried

The V2 architecture aimed to provide:

1. **Self-contained tools** - Each tool file contains detection + config + tasks
2. **Map-based configuration** - Clean `TOOL.property` syntax
3. **Tri-state enable logic** - `null`/`true`/`false` for auto-detect/force-on/force-off
4. **Parent override capability** - Project Taskfile can override tool config

## Critical Blockers Discovered

### 1. Parent Variables Don't Override Included Variables

**Expected Behavior:**
```yaml
# Parent Taskfile.yml
vars:
  TYPESCRIPT:
    map:
      enabled: "false"

includes:
  tools:
    taskfile: ./tools/typescript-v2.yml
    flatten: true
```

**Actual Behavior:**
- The `TYPESCRIPT` var in the included file takes precedence
- Parent vars are completely ignored
- This happens regardless of `flatten: true` or `flatten: false`
- This happens whether vars are in root `vars:` or `includes.vars:`

**Impact:** The core feature of V2 (override tool config from parent) **does not work**.

### 2. Boolean `false` Renders as Empty String

**Expected:**
```yaml
vars:
  TOOL:
    map:
      enabled: false

# Template: {{.TOOL.enabled}} → "false"
```

**Actual:**
```yaml
# Template: {{.TOOL.enabled}} → ""  (empty string)
```

**Impact:**
- Cannot distinguish `false` from `null` in templates
- Tri-state logic requires string values: `""`, `"true"`, `"false"`
- Loses the benefit of "native booleans"

### 3. Cannot Pass Maps Through Task Calls

**Attempted:**
```yaml
tasks:
  parent:
    vars:
      TYPESCRIPT:
        map:
          enabled: "false"
    cmds:
      - task: child
        vars:
          TYPESCRIPT: "{{.TYPESCRIPT}}"  # Doesn't work!
```

**Error:**
```
can't evaluate field enabled in type interface {}
```

**Impact:** Cannot pass configuration overrides through task composition.

### 4. Include Vars Don't Support Maps Well

**Attempted:**
```yaml
includes:
  tools:
    taskfile: ./tools.yml
    vars:
      TYPESCRIPT:
        map:
          enabled: "false"
```

**Result:** Still doesn't override the included file's default vars.

## What Actually Works

### ✅ Self-contained Tool Files

Tool files with embedded detection work fine:

```yaml
# tools/typescript-v2.yml
version: "3"

vars:
  _TYPESCRIPT_DETECTED:
    sh: test -f tsconfig.json && echo "1" || echo ""

tasks:
  typescript:check:
    preconditions:
      - sh: '[ -n "{{._TYPESCRIPT_DETECTED}}" ]'
    cmds:
      - tsc --noEmit
```

### ✅ String-Based Enable Flags

Shell script computation works:

```yaml
vars:
  ENABLE_TOOL:
    sh: |
      if [ -n "{{._TOOL_DETECTED}}" ]; then
        echo "1"
      else
        echo ""
      fi
```

### ✅ Map-Based Configuration (Read-Only)

Maps work for organizing config within a tool file:

```yaml
vars:
  TYPESCRIPT:
    map:
      tsconfig: tsconfig.json
      src_dir: src
      out_dir: dist

tasks:
  check:
    cmds:
      - tsc --project {{.TYPESCRIPT.tsconfig}}
```

### ❌ Parent Override of Tool Configuration

This is the critical missing piece. There's no way to:
- Override tool config from parent Taskfile
- Pass overrides through includes
- Pass overrides through task calls

## Alternative Approaches Considered

### Option A: Flat Variables (V1 Style)

```yaml
# Parent can override:
vars:
  ENABLE_TYPESCRIPT: "true"
  TYPESCRIPT_TSCONFIG: "tsconfig.build.json"
```

**Pros:**
- ✅ Parent override works
- ✅ Simple and predictable

**Cons:**
- ❌ Loses namespace benefits of maps
- ❌ Verbose (TYPESCRIPT_EVERY_PROPERTY)

### Option B: Environment Variables

```bash
export TYPESCRIPT_ENABLED="false"
task typescript:check
```

**Pros:**
- ✅ Works for override
- ✅ Per-invocation control

**Cons:**
- ❌ Not in Taskfile (external config)
- ❌ No type safety
- ❌ Harder to discover

### Option C: Separate Override Files

```yaml
# Taskfile.yml
includes:
  tools: ./tools.yml
  config: ./config/typescript-override.yml  # Sets TYPESCRIPT map
```

**Pros:**
- ✅ Explicit configuration
- ✅ Can be versioned

**Cons:**
- ❌ Still doesn't work (same var precedence issue)
- ❌ Extra files to manage

### Option D: Per-Project Tool Files

```yaml
# project/tools/typescript.yml
version: "3"

vars:
  TYPESCRIPT:
    map:
      enabled: "true"  # Project-specific

includes:
  base:
    taskfile: https://.../tools/typescript-base.yml
```

**Pros:**
- ✅ Full control per project

**Cons:**
- ❌ Duplicates tool file in every project
- ❌ Defeats purpose of centralized taskfiles

## Recommendations

### Short Term: Stick with V1

The V1 architecture (centralized detection.yml + flat ENABLE_* vars) works within Task's constraints:

```yaml
# Parent Taskfile.yml
vars:
  ENABLE_TYPESCRIPT: "true"  # This override WORKS

includes:
  detection: ./presets/detection.yml
  tools: ./tools.yml
    flatten: true
```

**Why this works:**
- Flat variables can be overridden by parent
- No complex map structures
- Battle-tested pattern

### Medium Term: Feature Request to Task

File an issue with go-task/task requesting:

1. **Parent var priority**: Option to make parent Taskfile vars override included file vars
2. **Deep map merging**: Merge map structures instead of replacing them
3. **Boolean template rendering**: Render `false` as `"false"` not `""`

###Long Term: V3 Architecture

If Task adds the needed features, revisit with:

1. **Map-based config** (when maps can be overridden)
2. **Native tri-state** (when booleans render correctly)
3. **Composition-friendly** (when vars can pass through calls)

## Conclusion

The V2 proof of concept was valuable for discovering Task's limitations. The investigation revealed that:

- ✅ Self-contained tool files are good for organization
- ✅ Map-based config is clean for internal tool structure
- ❌ **Parent override doesn't work** - this is the fatal flaw
- ❌ Cannot achieve the main goal of V2

**Decision: Abandon V2 architecture, improve V1 instead.**

## V1 Improvements to Pursue

Instead of V2, enhance V1 with:

1. **Better documentation** - Clearer override examples
2. **Validation tasks** - Check that required vars are set
3. **Info tasks** - Better visibility into configuration
4. **Preset bundles** - Common combinations (typescript-lib, python-cli, etc.)
5. **Migration helpers** - Tools to adopt taskfiles in existing projects

These improvements work within Task's constraints and provide real value.
