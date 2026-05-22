/**
 * Preservation Property Tests for turbo-dev-script
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * IMPORTANT: This test follows observation-first methodology
 * 
 * These tests verify that existing script behavior is preserved:
 * - `pnpm run dev` executes `node scripts/dev-auto.js` with automatic port detection
 * - `pnpm run build` executes Next.js build process
 * - `pnpm run start` starts production server
 * - `pnpm run lint` runs ESLint
 * 
 * Property 2: Preservation - Existing Script Behavior
 * For any command execution that is NOT `pnpm run dev:turbo`, the fixed package.json
 * SHALL produce exactly the same behavior as the original package.json.
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as fc from 'fast-check';

describe('Preservation Property Tests: Existing Script Behavior', () => {
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, 'package.json');

  describe('Unit Tests: Baseline Script Definitions', () => {
    it('should verify dev script uses dev-auto.js', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: dev script should execute node scripts/dev-auto.js
      expect(packageJson.scripts.dev).toBe('node scripts/dev-auto.js');
    });

    it('should verify build script uses next build', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: build script should execute next build
      expect(packageJson.scripts.build).toBe('next build');
    });

    it('should verify start script uses next start', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: start script should execute next start
      expect(packageJson.scripts.start).toBe('next start');
    });

    it('should verify lint script uses next lint', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: lint script should execute next lint
      expect(packageJson.scripts.lint).toBe('next lint');
    });

    it('should verify test script uses vitest run', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: test script should execute vitest run
      expect(packageJson.scripts.test).toBe('vitest run');
    });

    it('should verify test:watch script uses vitest', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Observe: test:watch script should execute vitest
      expect(packageJson.scripts['test:watch']).toBe('vitest');
    });
  });

  describe('Property-Based Tests: Script Behavior Preservation', () => {
    /**
     * Property: For all existing scripts (excluding dev:turbo), the script definition
     * in package.json should remain unchanged after the fix.
     * 
     * This property generates test cases for all existing scripts and verifies
     * their definitions remain constant.
     */
    it('should preserve all existing script definitions', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const existingScripts = packageJson.scripts;
      
      // Capture baseline script definitions
      const baselineScripts = {
        dev: 'node scripts/dev-auto.js',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        test: 'vitest run',
        'test:watch': 'vitest'
      };

      // Property: For all existing scripts, their definitions should match baseline
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(baselineScripts)),
          (scriptName) => {
            // Verify the script exists and matches baseline
            expect(existingScripts).toHaveProperty(scriptName);
            expect(existingScripts[scriptName]).toBe(baselineScripts[scriptName as keyof typeof baselineScripts]);
            return true;
          }
        ),
        { numRuns: 100 } // Run 100 times to test all scripts multiple times
      );
    });

    /**
     * Property: The dev script should always reference dev-auto.js
     * 
     * This property verifies that the dev script continues to use automatic
     * port detection via dev-auto.js, regardless of any changes to package.json.
     */
    it('should preserve dev script automatic port detection behavior', () => {
      fc.assert(
        fc.property(
          fc.constant('dev'),
          (scriptName) => {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const devScript = packageJson.scripts[scriptName];
            
            // Property: dev script must reference dev-auto.js
            expect(devScript).toContain('dev-auto.js');
            expect(devScript).toContain('node scripts/dev-auto.js');
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property: Build, start, and lint scripts should use Next.js commands
     * 
     * This property verifies that the standard Next.js workflow scripts
     * remain unchanged and continue to use Next.js CLI commands.
     */
    it('should preserve Next.js CLI commands for build, start, and lint', () => {
      const nextScripts = [
        { name: 'build', command: 'next build' },
        { name: 'start', command: 'next start' },
        { name: 'lint', command: 'next lint' }
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...nextScripts),
          (scriptConfig) => {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const script = packageJson.scripts[scriptConfig.name];
            
            // Property: Next.js scripts must use their respective CLI commands
            expect(script).toBe(scriptConfig.command);
            
            return true;
          }
        ),
        { numRuns: 75 } // Run 25 times per script
      );
    });

    /**
     * Property: Test scripts should use Vitest
     * 
     * This property verifies that test-related scripts continue to use
     * Vitest as the test runner.
     */
    it('should preserve Vitest test runner for test scripts', () => {
      const testScripts = [
        { name: 'test', command: 'vitest run' },
        { name: 'test:watch', command: 'vitest' }
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...testScripts),
          (scriptConfig) => {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const script = packageJson.scripts[scriptConfig.name];
            
            // Property: Test scripts must use Vitest
            expect(script).toBe(scriptConfig.command);
            expect(script).toContain('vitest');
            
            return true;
          }
        ),
        { numRuns: 50 } // Run 25 times per script
      );
    });

    /**
     * Property: Script count should not decrease
     * 
     * This property verifies that no existing scripts are removed.
     * New scripts (like dev:turbo) can be added, but existing ones must remain.
     */
    it('should not remove any existing scripts', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const existingScriptNames = ['dev', 'build', 'start', 'lint', 'test', 'test:watch'];

      fc.assert(
        fc.property(
          fc.constantFrom(...existingScriptNames),
          (scriptName) => {
            // Property: All existing scripts must still be present
            expect(packageJson.scripts).toHaveProperty(scriptName);
            expect(packageJson.scripts[scriptName]).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Non-dev:turbo scripts should not reference Turbo
     * 
     * This property verifies that the Turbo integration is isolated to
     * the dev:turbo script and does not affect existing scripts.
     */
    it('should not introduce Turbo references in existing scripts', () => {
      const existingScriptNames = ['dev', 'build', 'start', 'lint', 'test', 'test:watch'];

      fc.assert(
        fc.property(
          fc.constantFrom(...existingScriptNames),
          (scriptName) => {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const script = packageJson.scripts[scriptName];
            
            // Property: Existing scripts should not reference 'turbo'
            // (This ensures Turbo integration is isolated to dev:turbo)
            expect(script.toLowerCase()).not.toContain('turbo');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration Tests: Package Structure Validation', () => {
    /**
     * Integration test: Verify package.json structure is valid
     * 
     * This test verifies that package.json remains valid JSON with
     * the expected structure after any modifications.
     */
    it('should maintain valid package.json structure', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Verify essential package.json fields exist
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
      expect(packageJson).toHaveProperty('scripts');
      expect(packageJson).toHaveProperty('dependencies');
      expect(packageJson).toHaveProperty('devDependencies');
      
      // Verify scripts is an object
      expect(typeof packageJson.scripts).toBe('object');
      expect(packageJson.scripts).not.toBeNull();
      
      // Verify Turbo is still a dependency
      expect(packageJson.dependencies).toHaveProperty('turbo');
    });

    /**
     * Integration test: Verify all expected scripts are present
     * 
     * This test verifies that all baseline scripts remain in package.json
     * and have not been removed or modified.
     */
    it('should have all expected baseline scripts', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const expectedScripts = ['dev', 'build', 'start', 'lint', 'test', 'test:watch'];
      
      expectedScripts.forEach(scriptName => {
        expect(packageJson.scripts).toHaveProperty(scriptName);
        expect(typeof packageJson.scripts[scriptName]).toBe('string');
        expect(packageJson.scripts[scriptName].length).toBeGreaterThan(0);
      });
    });

    /**
     * Integration test: Verify script definitions are strings
     * 
     * This test verifies that all script definitions are valid strings
     * (not objects, arrays, or other types).
     */
    it('should have string values for all script definitions', () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      Object.entries(packageJson.scripts).forEach(([name, value]) => {
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      });
    });
  });
});
