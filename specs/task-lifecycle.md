# Task lifecycle test plan

Seed: `tests/seed.spec.ts` (custom fixtures, API authentication, isolated namespace).

1. Open the local workspace and verify the signed-in user's name.
2. Add `Review release` through the Task title field and Add task button.
3. Verify the new unchecked task appears in Task list.
4. Check it, reload, and verify the completed state persists.
5. Delete it and verify the task list is empty.

Negative case: simulate a 503 response for task creation, submit a title, and verify an accessible status message explains the error.

Hybrid case: create a task with the API client, complete it through UI, and poll the API to verify persisted state.

Acceptance: assertions remain intact; each test owns its data; no fixed sleeps or external websites; failure evidence includes trace/screenshot. Generated test files belong under `tests/ui/` to match project discovery.
