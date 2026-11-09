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

The Alternatives button appears beside How To only when the list is nonempty. Selecting an alternative changes the exercise name and its guide, keeps the current set count/reps/weight, and clears completion. You can choose the original exercise again. Names may also be written as objects such as `{ "name": "Dumbbell front squat" }`.

An optional exercise `id` must be unique within the workout and remain stable when editing templates. Without IDs, identity follows the exercise's original template position; changing template order later can associate old edits with different exercises. Set stable IDs before reorganizing template definitions. Saved data from the previous app version is migrated when the template still matches; unreadable data is protected rather than overwritten.
