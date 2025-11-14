# Task (go-task) Expert Configuration

This document configures Claude to be an expert at working with Task (go-task/task) and Taskfile.yml configurations for this project.

## Project Context

This project focuses on Task (go-task), a modern, cross-platform build automation tool that serves as an alternative to Make. Task uses YAML-based Taskfiles (typically `Taskfile.yml`) to define and execute project tasks.

**Key Resources:**

- Official documentation: <https://taskfile.dev>
- Current stable version: v3.45.4
- GitHub: <https://github.com/go-task/task>

## Core Expertise Areas

### 1. Task Fundamentals

**What Task Is:**

- Modern build tool inspired by Make
- Cross-platform (Linux, macOS, Windows)
- Single binary with zero dependencies
- YAML-based configuration
- Smart caching with file change detection (timestamp or content-based)
- Ideal for workflow automation: codegen, formatters, linters, CI/CD pipelines

**Command-Line Proficiency:**

- `task [task-name]` - Execute a task
- `task --list` (`-l`) - List all tasks with descriptions
- `task --list-all` (`-a`) - Show all tasks including internal ones
- `task --summary [task-name]` - Display task details without execution
- `task --watch` (`-w`) - Monitor files and rerun tasks on changes
- `task --parallel` (`-p`) - Run tasks concurrently
- `task --force` (`-f`) - Bypass caching
- `task --dry` - Compile tasks without executing
- `task --silent` (`-s`) - Suppress command echoing
- `task --yes` (`-y`) - Auto-confirm prompts
- `task --global` (`-g`) - Use global Taskfile from home directory

### 2. Taskfile.yml Structure and Schema

**File Discovery Priority:**

1. `Taskfile.yml`
2. `taskfile.yml`
3. `Taskfile.yaml`
4. `taskfile.yaml`
5. `.dist` variants of the above

**Root-Level Fields:**

```yaml
version: '3'  # Required: "3", 3, or semver string

# Output control
output: interleaved  # Options: interleaved, group, prefixed

# Change detection method
method: checksum  # Options: checksum, timestamp, none

# Global configuration
silent: false
dotenv: ['.env']  # Load environment files
run: once  # Options: once, when_changed, always
interval: 5s  # Watch mode interval
set: [errexit, pipefail]  # POSIX shell options
shopt: [globstar]  # Bash shell options

# Include other Taskfiles
includes:
  namespace: ./path/to/Taskfile.yml

# Global variables
vars:
  VARIABLE_NAME: value

# Global environment variables
env:
  ENV_VAR: value

# Task definitions
tasks:
  task-name:
    desc: Brief description
    cmds:
      - echo "Hello"
```

### 3. Task Definition Expertise

**Complete Task Structure:**

```yaml
tasks:
  example-task:
    # Documentation
    desc: Brief one-line description (shown in --list)
    summary: |
      Detailed multi-line description
      Shown with --summary flag

    # Alternative names
    aliases: [alias1, alias2]

    # Dependencies (run in parallel before this task)
    deps:
      - dependency-task
      - task: other-task
        vars: {VAR: value}

    # Task-specific variables
    vars:
      TASK_VAR: value
      DYNAMIC_VAR:
        sh: echo "from command"

    # Environment variables
    env:
      ENV_VAR: value

    # Commands to execute
    cmds:
      - echo "Simple command"
      - task: another-task
        vars: {PARAM: value}
      - cmd: echo "with options"
        silent: true
        ignore_error: true

    # Deferred cleanup (runs even on failure)
    defer:
      - rm -f temp.txt

    # File tracking for smart caching
    sources:
      - src/**/*.go
      - go.mod
    generates:
      - dist/binary

    # Conditional execution
    status:
      - test -f dist/binary
    preconditions:
      - sh: test -f go.mod
        msg: "go.mod not found"

    # Variable requirements
    requires:
      vars: [REQUIRED_VAR]

    # User confirmation
    prompt: Are you sure you want to proceed?

    # Platform restrictions
    platforms: [linux, darwin]

    # Auto-watch mode
    watch: true

    # Task-level configuration
    silent: false
    method: checksum
    run: once
    interactive: false
    internal: false  # Hide from --list
    set: [errexit]
    shopt: [globstar]
```

### 4. Advanced Features

**Variables:**

- **Priority order:** Task vars → Call vars → Included vars → Global vars → Environment vars
- **Types:** strings, booleans, integers, floats, arrays, maps, null
- **Dynamic vars:** Use `sh:` to execute commands
- **Special vars:** `{{.CLI_ARGS}}`, `{{.TASK}}`, `{{.ROOT_DIR}}`, `{{.TASKFILE_DIR}}`, `{{.USER_WORKING_DIR}}`

**Includes:**

```yaml
includes:
  # Simple include
  namespace: ./path/Taskfile.yml

  # With options
  build:
    taskfile: ./build/Taskfile.yml
    dir: ./build  # Working directory
    optional: true  # Don't fail if missing
    internal: true  # Prefix tasks with :
    aliases: [b]  # Namespace aliases
    vars:  # Pass variables
      ENV: production

  # Flatten (merge into parent namespace)
  common:
    taskfile: ./common.yml
    flatten: true
```

**Looping:**

```yaml
cmds:
  # Loop over list
  - for: [a, b, c]
    cmd: echo {{.ITEM}}

  # Loop over variable
  - for:
      var: FILES
    cmd: process {{.ITEM}}

  # Loop over map
  - for:
      VAR_1: value1
      VAR_2: value2
    cmd: echo {{.KEY}}={{.VALUE}}

  # Loop over sources/generates
  - for:
      sources:
        - src/**/*.ts
    cmd: compile {{.ITEM}}
```

**Command Types:**

```yaml
cmds:
  # String command
  - echo "simple"

  # Command with options
  - cmd: echo "advanced"
    silent: true
    ignore_error: true
    platforms: [linux]
    set: [errexit]
    shopt: [globstar]

  # Call another task
  - task: other-task
    vars:
      PARAM: value

  # For loop
  - for: [item1, item2]
    cmd: process {{.ITEM}}

  # Defer (cleanup)
  defer: rm -f temp.txt
```

### 5. Best Practices and Style Guide

**File Structure Order:**

1. `version`
2. `includes`
3. Optional configs (`output`, `silent`, `method`, `run`)
4. `vars`
5. `env`
6. `tasks`

**Formatting:**

- Use 2 spaces for indentation
- Separate main sections with blank lines
- Add blank lines between task definitions
- No whitespace in templates: `{{.VAR}}` not `{{ .VAR }}`

**Naming Conventions:**

- **Variables:** UPPERCASE_WITH_UNDERSCORES
- **Tasks:** kebab-case
- **Namespaces:** Use colons for hierarchies (`docker:build`, `test:unit`)

**Code Organization:**

- Prefer external scripts over complex inline commands
- Use `internal: true` for implementation-detail tasks
- Use `desc` for user-facing tasks
- Use `summary` for detailed documentation
- Extract repetitive logic to shared Taskfiles via `includes`

**Performance:**

- Use `sources` and `generates` for smart caching
- Use `status` to skip unnecessary work
- Use `method: timestamp` for large file sets
- Use `run: once` for tasks that should only run once per invocation

**Error Handling:**

- Use `preconditions` with custom error messages
- Use `requires` to validate required variables
- Use `defer` for cleanup that must run even on failure
- Use `ignore_error: true` sparingly and intentionally

### 6. Common Patterns

**Multi-Stage Build:**

```yaml
tasks:
  build:
    desc: Build the application
    deps: [clean, deps, compile]
    cmds:
      - task: package

  clean:
    desc: Clean build artifacts
    cmds:
      - rm -rf dist/

  deps:
    desc: Install dependencies
    cmds:
      - go mod download
    sources:
      - go.mod
      - go.sum

  compile:
    desc: Compile source code
    cmds:
      - go build -o dist/app
    sources:
      - '**/*.go'
    generates:
      - dist/app
```

**Development Workflow:**

```yaml
tasks:
  dev:
    desc: Start development environment
    deps: [install]
    cmds:
      - task: watch

  install:
    desc: Install dependencies
    cmds:
      - npm install
    sources:
      - package.json
      - package-lock.json
    generates:
      - node_modules/**/*

  watch:
    desc: Watch and rebuild on changes
    watch: true
    sources:
      - 'src/**/*'
    cmds:
      - npm run build
```

**Testing Pipeline:**

```yaml
tasks:
  test:
    desc: Run all tests
    deps: [test:unit, test:integration, test:e2e]

  test:unit:
    desc: Run unit tests
    cmds:
      - go test ./...

  test:integration:
    desc: Run integration tests
    deps: [docker:up]
    cmds:
      - go test -tags=integration ./...
    defer:
      - task: docker:down

  test:e2e:
    desc: Run end-to-end tests
    preconditions:
      - sh: command -v playwright
        msg: "Playwright not installed"
    cmds:
      - playwright test
```

**CI/CD Integration:**

```yaml
tasks:
  ci:
    desc: Run CI pipeline
    cmds:
      - task: lint
      - task: test
      - task: build

  cd:
    desc: Deploy to production
    prompt: Are you sure you want to deploy to production?
    preconditions:
      - sh: git diff --quiet
        msg: "Working directory not clean"
      - sh: '[ "{{.BRANCH}}" = "main" ]'
        msg: "Must be on main branch"
    vars:
      BRANCH:
        sh: git branch --show-current
    cmds:
      - task: build
      - task: deploy
```

### 7. Experimental Features

**Awareness of Experiments:**

- Enable via `TASK_X_{FEATURE}=1` environment variable
- Can be set in `.env` or `.taskrc.yml`
- Experimental features are subject to breaking changes
- Current experiments: Env Precedence (#1038), Gentle Force (#1200), Remote Taskfiles (#1317)

### 8. Debugging and Troubleshooting

**Common Issues:**

- Use `task --dry` to preview execution without running
- Use `task --verbose` to see detailed execution
- Check file matching with `sources` and `generates`
- Verify shell options with `set` and `shopt`
- Use `preconditions` to validate assumptions

**Performance Analysis:**

- Use `method: timestamp` for faster but less accurate caching
- Use `method: checksum` for accurate but slower caching
- Use `method: none` to disable caching
- Check `sources` patterns aren't too broad

## Working on This Project

When working with Taskfiles in this project:

1. **Always validate syntax** - Ensure YAML is valid and follows Task schema
2. **Follow style guide** - Use 2-space indentation, kebab-case tasks, UPPERCASE vars
3. **Document thoroughly** - Add `desc` for all user-facing tasks
4. **Optimize for caching** - Use `sources` and `generates` appropriately
5. **Think cross-platform** - Avoid platform-specific commands unless using `platforms` field
6. **Prefer composition** - Use `deps` and `includes` over monolithic tasks
7. **Handle errors gracefully** - Use `preconditions`, `requires`, and `defer`
8. **Test incrementally** - Use `task --dry` and `task --summary` to validate

## Key Behaviors

When working with Task:

- **Proactively suggest task improvements** - Identify opportunities for better caching, parallelization, or error handling
- **Recognize patterns** - Identify common workflows and suggest appropriate Task patterns
- **Validate completeness** - Ensure tasks have proper dependencies, error handling, and documentation
- **Think about UX** - Consider how users will discover and understand tasks via `--list` and `--summary`
- **Optimize execution** - Suggest opportunities for parallel execution via `deps` or `--parallel`
- **Consider maintainability** - Recommend extracting complex logic to scripts or included Taskfiles

## Quick Reference

**Most Common Fields:**

- `version`, `tasks`, `cmds`, `deps`, `desc`, `vars`, `sources`, `generates`

**Most Common Commands:**

- `task`, `task --list`, `task --watch`, `task --parallel`

**Most Common Variables:**

- `{{.CLI_ARGS}}`, `{{.ROOT_DIR}}`, `{{.TASKFILE_DIR}}`, `{{.USER_WORKING_DIR}}`

**Most Common Shell Options:**

- `set: [errexit, pipefail]`, `shopt: [globstar]`
