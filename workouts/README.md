# Workout templates

Copy `full-body.json` to a new JSON file to define another workout.

- Give each workout a unique, stable `id` and a display `name`.
- List exercises in the order they should appear.
- Each object in `sets` represents one set. Add or remove objects to change the starting set count; keep at least one set per exercise.
- `reps` is a whole number from 1 to 1000. For single-leg exercises, it means reps per side.
- `weight` is in kilograms, from 0 to 2000, with at most one decimal place. Use 0 for bodyweight or as an unconfigured starting value.
- The sample uses 10 reps and 0 kg as editable placeholders, not a prescribed training load.
- Templates contain starting values only. Completion and session history belong in saved app data.

The top-bar selector loads Full Body, Upper, and Lower. Each workout retains its own edited sets and completion state in browser storage. The last selected workout is restored on reopening.

Serve the repository through GitHub Pages or a local HTTP server (`python -m http.server 8000` from the repository folder). Opening `index.html` directly cannot fetch JSON templates.

To register another template, add an option to `#workout-select` in `index.html` with its ID as the value. The app loads `workouts/<id>.json`. Keep IDs stable so saved workout data remains associated with the correct template.


## Exercise editing, order, and alternatives

Click an exercise name to edit it; Save or Enter applies it, Cancel or Escape discards it. Drag the dotted handle to reorder exercises on desktop or phone. Keyboard users can focus the handle and press Up or Down. Names and order save separately for each workout on the current browser/device, without changing the template files.

Add an optional `alternatives` list to an exercise:

```json
{
  "id": "squat",
  "name": "Goblet squat",
  "alternatives": ["Dumbbell front squat", "Kettlebell goblet squat"],
  "sets": [{ "reps": 10, "weight": 0 }]
}
```

The Alternatives option appears in the three-dot menu only when the list is nonempty. Selecting an alternative changes the name and guide, loads its latest completed sets (or template values if it has no history), and clears completion. You can choose the original exercise again. Names may also be written as objects such as `{ "name": "Dumbbell front squat" }`.

An optional exercise `id` must be unique within the workout and remain stable when editing templates. Without IDs, identity follows the exercise's original template position; changing template order later can associate old edits with different exercises. Set stable IDs before reorganizing template definitions. Saved data from the previous app version is migrated when the template still matches; unreadable data is protected rather than overwritten.


## Sessions and history

- **Start workout** creates a dated session. Previous completed sets for each exercise supply its set count, reps, and weight. Other template or undated legacy values remain the starting point when there is no finished history. Completion starts unchecked.
- **Finish workout** archives a snapshot, with confirmation. At least one completed set is required. Incomplete sets are excluded from history display and future prefilling. Editing a new session never alters archived sessions.
- Unfinished sessions resume after closing/reopening, including order, names, values, and completion. Different workouts can have separate unfinished sessions.
- The three-dot menu's **History** shows completed sets from finished sessions, newest first. **Use these values** copies a history entry to the active exercise after confirmation and clears completion.
- Renaming preserves exercise identity. `exerciseId` is the stable history identity and can be shared across workouts for the same exercise. Exercise `id` identifies its position/slot in the workout and must also stay stable if supplied. Existing generated slot IDs are retained during migration.
- Alternatives can be strings, or objects with a stable history ID: `{ "id": "exercise-cable-kickbacks", "name": "Cable kickbacks" }`. Matching IDs share history; each alternative normally has its own identity. Keep IDs unchanged when updating display names.
- **Export backup** downloads a JSON backup of finished sessions, active sessions, workout presets, and available legacy values. **Import backup** validates the file and, after confirmation, replaces current stored training data. Export first to keep a copy before importing. Invalid files leave existing data untouched.
- Everything stays in this browser/device's localStorage, under `form-training-v1`. There is no server sync. Clearing site data removes it. Legacy `form-workout-*-v2` values remain untouched and supply starting values when upgrading; no historical dates are invented.

## Browser checks

With Node.js, Playwright, and Chromium available, run `node tests/sessions.cjs` from the repository root. Set `CHROMIUM_PATH` if Chromium is not `/usr/bin/chromium`. The suite serves the app locally and tests real session, persistence, history, backup, migration, and responsive flows. Guide requests are stubbed; it does not validate the external RepDB service.
