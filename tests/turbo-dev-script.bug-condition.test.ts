/**
 * Bug Condition Exploration Test for turbo-dev-script
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test verifies the bug condition:
 * - `pnpm run dev:turbo` fails with "Missing script" error
 * - turbo.json file does not exist in project root
 * - Turbo is installed in node_modules (should pass)
 * 
 * After the fix is implemented, this same test will verify the expected behavior:
 * - `pnpm run dev:turbo` executes successfully
 * - turbo.json exists with valid pipeline configuration
 * - Turbo is invoked (check for Turbo-specific output messages)
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Bug Condition Exploration: dev:turbo Script Missing', () => {
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, 'package.json');
  const turboJsonPath = join(projectRoot, 'turbo.json');
  const nodeModulesPath = join(projectRoot, 'node_modules');

  it('should verify Turbo is installed in node_modules', () => {
    // This should PASS even on unfixed code - Turbo is already a dependency
    const turboPath = join(nodeModulesPath, 'turbo');
    expect(existsSync(turboPath)).toBe(true);
  });

  it('should verify dev:turbo script exists in package.json', () => {
    // This will FAIL on unfixed code - the script does not exist yet
    // After fix: This will PASS - the script will be added
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.scripts).toHaveProperty('dev:turbo');
    expect(packageJson.scripts['dev:turbo']).toBeTruthy();
  });

  it('should verify turbo.json configuration file exists', () => {
    // This will FAIL on unfixed code - turbo.json does not exist yet
    // After fix: This will PASS - turbo.json will be created
    expect(existsSync(turboJsonPath)).toBe(true);
  });

  it('should verify turbo.json contains valid pipeline configuration', () => {
    // This will FAIL on unfixed code - turbo.json does not exist yet
    // After fix: This will PASS - turbo.json will have valid configuration
    expect(existsSync(turboJsonPath)).toBe(true);
    
    const turboJson = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));
    
    // Verify schema reference
    expect(turboJson).toHaveProperty('$schema');
    
    // Verify pipeline exists
    expect(turboJson).toHaveProperty('pipeline');
    
    // Verify dev task configuration
    expect(turboJson.pipeline).toHaveProperty('dev');
    expect(turboJson.pipeline.dev).toHaveProperty('cache', false);
    expect(turboJson.pipeline.dev).toHaveProperty('persistent', true);
  });

  it('should execute pnpm run dev:turbo without errors', () => {
    // This will FAIL on unfixed code - the script does not exist
    // After fix: This will PASS - the script will execute successfully
    
    // Note: We use a timeout to prevent the dev server from running indefinitely
    // We just want to verify it starts without errors
    let output = '';
    let error: any = null;
    
    try {
      // Run the command with a timeout of 5 seconds
      // We expect it to start successfully, then we'll kill it
      output = execSync('pnpm run dev:turbo', {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 5000,
        stdio: 'pipe'
      });
    } catch (e: any) {
      error = e;
      output = e.stdout?.toString() || '';
      
      // If the error is due to timeout, that's actually success
      // (the dev server started and kept running)
      if (e.killed && e.signal === 'SIGTERM') {
        // This is expected - the dev server started successfully
        error = null;
      }
    }
    
    // On unfixed code: This will fail with "Missing script: dev:turbo"
    // After fix: Either no error, or timeout error (which means it started successfully)
    if (error) {
      const errorMessage = error.message || error.stderr?.toString() || '';
      // Check if it's a "Missing script" error
      expect(errorMessage).not.toContain('Missing script');
      expect(errorMessage).not.toContain('dev:turbo');
    }
    
    // Verify Turbo was invoked (check for Turbo-specific output)
    // This might be in stdout or stderr depending on how Turbo outputs
    const allOutput = output + (error?.stderr?.toString() || '');
    expect(allOutput.toLowerCase()).toMatch(/turbo|running|task/);
  });
});
