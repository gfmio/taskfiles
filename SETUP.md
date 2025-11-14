# Setup Complete! 🎉

This repository has been initialized with a modular, polyglot Taskfile system.

## What Was Created

### Directory Structure

```
taskfiles/
├── presets/              # Auto-detection and variable presets
│   └── detection.yml     # Detects languages, tools, frameworks
├── tools/                # Tool-specific tasks
│   └── biome.yml         # Biome linter/formatter (example)
├── logical/              # High-level workflow tasks
│   └── lint.yml          # Polyglot linting workflow (example)
├── examples/             # Example projects for testing
│   └── typescript-basic/ # Basic TypeScript example
├── tools.yml             # Aggregator for all tool taskfiles
├── logical.yml           # Aggregator for all logical taskfiles
├── Taskfile.yml          # Root taskfile
├── package.json          # Project metadata
├── README.md             # User documentation
└── [config files]        # biome.json, .gitignore, etc.
```

### Key Features Implemented

1. **Auto-Detection System** ([presets/detection.yml](presets/detection.yml))
   - Detects TypeScript, JavaScript, Python, Rust, Go
   - Detects 30+ tools and frameworks
   - Provides `ENABLE_*` variables for all detected items

2. **Tool Taskfile Pattern** ([tools/biome.yml](tools/biome.yml))
   - Each tool has its own file with `ENABLE_TOOL` variable
   - Uses `status` to skip gracefully if not enabled
   - Includes proper `sources` and `generates` for caching
   - Provides check/fix/watch variants

3. **Logical Workflow Pattern** ([logical/lint.yml](logical/lint.yml))
   - High-level, polyglot tasks
   - Automatically runs appropriate tools based on detection
   - Silently skips unavailable stacks

4. **Flexible Base URL**
   - Supports remote includes (GitHub raw URLs)
   - Auto-detects local copies (`./taskfiles`, `../taskfiles`)
   - Can be overridden via `TASKFILES_BASE_URL` variable

5. **Example Project** ([examples/typescript-basic/](examples/typescript-basic/))
   - Demonstrates usage in a TypeScript project
   - Shows detection working correctly
   - Includes README with instructions

## Testing the Setup

```bash
# Validate all Taskfiles
task validate

# See what was detected in this repo
task info

# List all available tasks
task --list-all

# Test the example project
cd examples/typescript-basic
bun install
task info
task --list-all
```

## Next Steps

### Adding New Tools (PR by PR)

Each tool should be added in a separate PR. Here's the checklist:

#### For a New Tool Taskfile

1. Create `tools/your-tool.yml`:

   ```yaml
   version: "3"

   vars:
     ENABLE_YOUR_TOOL: '{{.ENABLE_YOUR_TOOL | default "false"}}'

   tasks:
     your-tool:check:
       desc: Run your-tool checks
       status:
         - '[ "{{.ENABLE_YOUR_TOOL}}" != "true" ]'
       cmds:
         - your-tool check
   ```

2. Add include to [tools.yml](tools.yml):

   ```yaml
   your-tool:
     taskfile: ./tools/your-tool.yml
     flatten: true
   ```

3. Add detection to [presets/detection.yml](presets/detection.yml):

   ```yaml
   ENABLE_YOUR_TOOL:
     sh: |
       if [ -f "your-tool.config" ]; then
         echo "true"
       else
         echo "false"
       fi
   ```

4. Update logical workflows to use the new tool

5. Add test case in examples/

6. Update README.md

#### For a New Logical Workflow

1. Create `logical/your-workflow.yml`
2. Add includes for each language variant (with `status` checks)
3. Add include to [logical.yml](logical.yml)
4. Test with multiple project types
5. Update README.md

### Suggested PR Sequence

**Phase 1: TypeScript/JavaScript Tools**

1. PR: Add `vitest` (test framework)
2. PR: Add `tsc` (type checker)
3. PR: Add `tsup` (bundler)
4. PR: Add `eslint` (linter)
5. PR: Add `prettier` (formatter)

**Phase 2: TypeScript/JavaScript Workflows**
6. PR: Add `test` workflow
7. PR: Add `typecheck` workflow
8. PR: Add `build` workflow
9. PR: Add `format` workflow

**Phase 3: Universal Tools**
10. PR: Add `git` tasks
11. PR: Add `commitlint`
12. PR: Add `markdownlint`
13. PR: Add `yamllint`

**Phase 4: Python Support**
14. PR: Add `ruff` (linter/formatter)
15. PR: Add `mypy` (type checker)
16. PR: Add `pytest` (test framework)

**Phase 5: Other Languages**
17. PR: Add Rust toolchain (cargo, clippy, rustfmt)
18. PR: Add Go toolchain (go, golangci-lint)

**Phase 6: CI/CD**
19. PR: Add `ci` workflow
20. PR: Add `docs` workflow
21. PR: Add GitHub Actions examples

### Versioning Strategy

Once stable:

1. Tag `v1.0.0`
2. Create branches for major versions (`v1`, `v2`)
3. Update examples to use versioned URLs:

   ```yaml
   taskfile: https://raw.githubusercontent.com/gfmio/taskfiles/v1/tools.yml
   ```

## Architecture Decisions

### Why Not Flatten Detection?

The `detection` include is NOT flattened to avoid task name conflicts. This keeps the `detection:info` task separate from any root-level `info` task.

### Why Use `status` Instead of `preconditions`?

`preconditions` fail the task loudly, while `status` skips silently. For optional stacks, we want silent skipping, so we use `status` with the pattern:

```yaml
status:
  - '[ "{{.ENABLE_TOOL}}" != "true" ]'
```

This returns 0 (skip) if the tool is NOT enabled, and non-zero (run) if it IS enabled.

### Why Per-Tool Enable Variables?

Each tool has its own `ENABLE_TOOL` variable (in addition to language-level `ENABLE_TYPESCRIPT` etc.) because:

1. Users might want TypeScript but not Biome (use ESLint instead)
2. Allows fine-grained control
3. Makes testing easier (enable one tool at a time)

### Why Separate tools/ and logical/?

**tools/** = Tool implementation details

- Specific to one tool
- Low-level commands
- Changes when tool changes

**logical/** = User workflows

- Language/tool agnostic
- High-level tasks
- Stable API

This separation allows swapping tools without changing user-facing workflows.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Key principles:

- One tool/workflow per PR
- Include detection logic
- Add test cases
- Update documentation
- Follow existing patterns

## Resources

- [Task Documentation](https://taskfile.dev)
- [Task Remote Taskfiles](https://taskfile.dev/experiments/remote-taskfiles/)
- [Template TypeScript Library](https://github.com/gfmio/template-typescript-library)
