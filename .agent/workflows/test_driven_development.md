---
description: Prioritize automated tests for all assertions and changes.
---
# Test-First Development Workflow

This workflow enforces a strict protocol where automated tests are the primary source of truth and validation.

1. **Assess Test Coverage**
   - Before making any code changes, locate the relevant test file.
   - Run the existing tests to establish a baseline.

2. **Update/Create Tests FIRST**
   - **If the feature is new**: Write a new test file or test case describing the expected behavior.
   - **If the feature exists but lacks coverage**: Write tests to cover the existing logic *before* modifying it.
   - **If the test is outdated**: Update the test to reflect the new requirements.

3. **Verify Failure (Red)**
   - Run the new tests.
   - Ensure they fail as expected (verifying the test captures the missing feature/bug).

4. **Implement Changes (Green)**
   - Write the minimal code necessary to make the tests pass.

5. **Refactor & Verify**
   - Refactor code if needed.
   - Run the full suite to ensure no regressions.
   - **DO NOT** use manual verification as the primary assertion method. Automated tests must pass.
