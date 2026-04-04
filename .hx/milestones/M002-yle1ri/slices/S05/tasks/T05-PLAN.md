---
estimated_steps: 12
estimated_files: 7
skills_used: []
---

# T05: Extension manifest hook array updates (7 manifests)

Update `provides.hooks` arrays in 7 bundled extension manifests to match their actual `pi.on()` registrations.

**Steps:**

For each manifest, open the file and replace the `"hooks"` array with the correct list:

1. **`src/resources/extensions/hx/extension-manifest.json`**: Set `"hooks"` to `["session_start", "session_switch", "bash_transform", "session_fork", "before_agent_start", "agent_end", "session_before_compact", "session_shutdown", "tool_call", "tool_result", "tool_execution_start", "tool_execution_end", "model_select", "before_provider_request", "turn_end"]`

2. **`src/resources/extensions/async-jobs/extension-manifest.json`**: Add `"session_before_switch"` and `"session_shutdown"` to the existing `"hooks"` array (currently `["session_start"]`).

3. **`src/resources/extensions/bg-shell/extension-manifest.json`**: Add `"session_compact"`, `"session_tree"`, `"session_switch"`, `"before_agent_start"`, `"session_start"`, `"turn_end"`, `"agent_end"`, `"tool_execution_end"` to the existing array (currently `["session_shutdown"]`).

4. **`src/resources/extensions/browser-tools/extension-manifest.json`**: Add `"session_start"` to the existing array (currently `["session_shutdown"]`).

5. **`src/resources/extensions/context7/extension-manifest.json`**: Add `"session_shutdown"` to the existing array (currently `["session_start"]`).

6. **`src/resources/extensions/google-search/extension-manifest.json`**: Add `"session_shutdown"` to the existing array (currently `["session_start"]`).

7. **`src/resources/extensions/search-the-web/extension-manifest.json`**: Add `"session_start"` to the existing array (currently `["model_select", "before_provider_request"]`).

Before editing each file, read it to confirm the current `"hooks"` value matches what the research doc says — if it already has the correct hooks, skip that file.

**Verify:** `npx tsc --noEmit` (JSON changes don't affect types but confirms no regressions). Confirm JSON validity: `node -e "require('./src/resources/extensions/hx/extension-manifest.json')"` etc. for each file.

## Inputs

- ``src/resources/extensions/hx/extension-manifest.json``
- ``src/resources/extensions/async-jobs/extension-manifest.json``
- ``src/resources/extensions/bg-shell/extension-manifest.json``
- ``src/resources/extensions/browser-tools/extension-manifest.json``
- ``src/resources/extensions/context7/extension-manifest.json``
- ``src/resources/extensions/google-search/extension-manifest.json``
- ``src/resources/extensions/search-the-web/extension-manifest.json``

## Expected Output

- ``src/resources/extensions/hx/extension-manifest.json``
- ``src/resources/extensions/async-jobs/extension-manifest.json``
- ``src/resources/extensions/bg-shell/extension-manifest.json``
- ``src/resources/extensions/browser-tools/extension-manifest.json``
- ``src/resources/extensions/context7/extension-manifest.json``
- ``src/resources/extensions/google-search/extension-manifest.json``
- ``src/resources/extensions/search-the-web/extension-manifest.json``

## Verification

cd /Users/beratcan/Desktop/GithubProjects/hx-ai/.hx/worktrees/M002-yle1ri && node -e "['hx','async-jobs','bg-shell','browser-tools','context7','google-search','search-the-web'].forEach(e => { const m = require('./src/resources/extensions/' + e + '/extension-manifest.json'); console.log(e, JSON.stringify(m.provides?.hooks)); })"
