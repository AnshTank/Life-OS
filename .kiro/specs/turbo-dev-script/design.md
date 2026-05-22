# Turbo Dev Script Bugfix Design

## Overview

This bugfix adds the missing `dev:turbo` npm script and turbo.json configuration to enable Turbo-powered development builds. The project already has Turbo installed (^2.9.6) but lacks the configuration to use it. The fix will add a new `dev:turbo` script that leverages Turbo's caching and task orchestration capabilities while preserving the existing `dev` script that uses automatic port detection via `scripts/dev-auto.js`.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user attempts to run `pnpm run dev:turbo` but the script does not exist
- **Property (P)**: The desired behavior when `dev:turbo` is executed - Turbo should run the Next.js development server with caching enabled
- **Preservation**: Existing `dev` script behavior (automatic port detection via dev-auto.js) that must remain unchanged by the fix
- **Turbo**: A high-performance build system that provides intelligent caching and task orchestration
- **turbo.json**: Configuration file that defines Turbo's pipeline tasks, caching behavior, and dependencies
- **dev-auto.js**: Existing script in `scripts/dev-auto.js` that automatically detects and allocates available ports for the development server

## Bug Details

### Bug Condition

The bug manifests when a user attempts to run `pnpm run dev:turbo` to start a Turbo-powered development server. The package.json file does not contain a `dev:turbo` script definition, and there is no turbo.json configuration file to define how Turbo should execute development tasks.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CommandExecution
  OUTPUT: boolean
  
  RETURN input.command == "pnpm run dev:turbo"
         AND NOT scriptExists("dev:turbo", "package.json")
         AND NOT fileExists("turbo.json")
END FUNCTION
```

### Examples

- **Example 1**: User runs `pnpm run dev:turbo` → System returns error "Missing script: dev:turbo" (current behavior)
- **Example 2**: User wants to leverage Turbo's caching for faster rebuilds → No configuration exists to enable this (current behavior)
- **Example 3**: User runs `pnpm run dev` → System correctly executes `node scripts/dev-auto.js` with automatic port detection (existing behavior that must be preserved)
- **Edge Case**: User has multiple Next.js projects and wants to use Turbo to orchestrate them → No turbo.json configuration exists to define task dependencies

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The existing `dev` script must continue to execute `node scripts/dev-auto.js` exactly as before
- Automatic port detection and allocation via dev-auto.js must remain unchanged
- All other existing scripts (build, start, lint) must continue to function exactly as before
- The project's development workflow for users who prefer the standard dev script must be unaffected

**Scope:**
All inputs that do NOT involve the `dev:turbo` command should be completely unaffected by this fix. This includes:
- Running `pnpm run dev` (standard development server)
- Running `pnpm run build` (production build)
- Running `pnpm run start` (production server)
- Running `pnpm run lint` (linting)
- Any other existing npm scripts

## Hypothesized Root Cause

Based on the bug description, the root cause is clear:

1. **Missing Script Definition**: The package.json file does not contain a `dev:turbo` script entry in the "scripts" section

2. **Missing Configuration File**: No turbo.json file exists in the project root to configure Turbo's pipeline and caching behavior

3. **Incomplete Turbo Integration**: While Turbo is installed as a dependency (^2.9.6), the integration was never completed with the necessary configuration and scripts

4. **No Task Pipeline Definition**: Without turbo.json, Turbo has no knowledge of what tasks to run, what to cache, or how to orchestrate the development workflow

## Correctness Properties

Property 1: Bug Condition - dev:turbo Script Execution

_For any_ command execution where `pnpm run dev:turbo` is invoked, the fixed package.json SHALL contain a `dev:turbo` script that executes Turbo with the appropriate development task, and a turbo.json configuration file SHALL exist to define the pipeline behavior, resulting in a successful Turbo-powered development server startup.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Script Behavior

_For any_ command execution that is NOT `pnpm run dev:turbo` (such as `pnpm run dev`, `pnpm run build`, `pnpm run start`, `pnpm run lint`), the fixed package.json SHALL produce exactly the same behavior as the original package.json, preserving all existing script functionality including automatic port detection via dev-auto.js.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

The root cause analysis indicates we need to add two things: a script definition and a configuration file.

**File 1**: `package.json`

**Section**: `scripts`

**Specific Changes**:
1. **Add dev:turbo Script**: Add a new entry `"dev:turbo": "turbo run dev"` to the scripts section
   - This will invoke Turbo to run the "dev" task as defined in turbo.json
   - The script should be added after the existing "dev" script for logical grouping

**File 2**: `turbo.json` (new file in project root)

**Specific Changes**:
1. **Create Configuration File**: Create a new turbo.json file with pipeline definitions
   - Define a "dev" task that runs the Next.js development server
   - Configure caching behavior (dev servers typically should not be cached)
   - Set up appropriate environment variables and outputs

2. **Pipeline Configuration**: Define the dev task with:
   - `cache: false` - Development servers should not be cached as they need to reflect live changes
   - `persistent: true` - The dev server runs continuously and should not exit
   - `dependsOn: []` - No dependencies for the dev task in this single-package setup

3. **Global Configuration**: Set up global Turbo settings:
   - `$schema` - Reference to Turbo's JSON schema for IDE support
   - `globalDependencies` - Files that should invalidate all caches when changed (e.g., .env files)

**Example turbo.json structure**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": [".next/**", "!.next/cache/**"],
      "dependsOn": ["^build"]
    },
    "lint": {
      "cache": true
    }
  }
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug exists on the unfixed code by attempting to run `dev:turbo`, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the `dev:turbo` script does not exist and turbo.json is missing.

**Test Plan**: Attempt to run `pnpm run dev:turbo` on the UNFIXED code and verify it fails with a "Missing script" error. Check that turbo.json does not exist in the project root.

**Test Cases**:
1. **Missing Script Test**: Run `pnpm run dev:turbo` (will fail on unfixed code with "Missing script: dev:turbo")
2. **Missing Config Test**: Check for existence of turbo.json file (will not exist on unfixed code)
3. **Turbo Installation Test**: Verify Turbo is installed in node_modules (should pass - Turbo is already installed)
4. **Existing Dev Script Test**: Run `pnpm run dev` to verify current behavior (should pass - existing script works)

**Expected Counterexamples**:
- Command `pnpm run dev:turbo` fails with error indicating the script does not exist
- File turbo.json does not exist in the project root
- Possible causes: incomplete Turbo integration, missing configuration step during initial setup

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (attempting to run dev:turbo), the fixed code produces the expected behavior (successful Turbo execution).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := executeCommand_fixed("pnpm run dev:turbo")
  ASSERT result.exitCode == 0 OR result.status == "running"
  ASSERT result.output CONTAINS "turbo" OR "next dev"
  ASSERT fileExists("turbo.json")
END FOR
```

**Test Plan**: After implementing the fix, run `pnpm run dev:turbo` and verify:
- The command executes without errors
- Turbo is invoked (check output for Turbo-specific messages)
- The Next.js development server starts successfully
- The turbo.json file exists and is valid JSON

**Test Cases**:
1. **Script Execution Test**: Run `pnpm run dev:turbo` and verify it starts without errors
2. **Turbo Invocation Test**: Verify Turbo is actually being used (check for Turbo output messages)
3. **Dev Server Start Test**: Verify the Next.js development server starts and is accessible
4. **Config Validation Test**: Verify turbo.json exists and contains valid configuration

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (running other scripts), the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT executeCommand_original(input) = executeCommand_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing scripts, then write tests capturing that behavior and verify it remains unchanged after the fix.

**Test Cases**:
1. **Dev Script Preservation**: Run `pnpm run dev` and verify it still executes `node scripts/dev-auto.js` with automatic port detection
2. **Build Script Preservation**: Run `pnpm run build` and verify it produces the same output as before
3. **Start Script Preservation**: Run `pnpm run start` and verify it starts the production server as before
4. **Lint Script Preservation**: Run `pnpm run lint` and verify linting behavior is unchanged
5. **Port Detection Preservation**: Run `pnpm run dev` on a system where port 3000 is occupied and verify automatic port detection still works

### Unit Tests

- Test that `dev:turbo` script exists in package.json after fix
- Test that turbo.json file exists and is valid JSON after fix
- Test that turbo.json contains required pipeline definitions (dev task)
- Test that existing scripts remain unchanged in package.json

### Property-Based Tests

- Generate random npm script invocations (excluding dev:turbo) and verify behavior is identical before and after fix
- Generate random port occupation scenarios and verify dev-auto.js still handles them correctly
- Test that all existing scripts continue to work across many different system states

### Integration Tests

- Test full development workflow: install dependencies → run dev:turbo → verify server starts → make code change → verify hot reload works
- Test switching between `pnpm run dev` and `pnpm run dev:turbo` in the same project
- Test that Turbo's caching works correctly for build and lint tasks (if configured in turbo.json)
- Test that environment variables are correctly passed through to the development server when using dev:turbo
