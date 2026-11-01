# Workout templates

Copy `full-body-a.json` to a new JSON file to define another workout.

- Give each workout a unique, stable `id` and a display `name`.
- List exercises in the order they should appear.
- Each object in `sets` represents one set. Add or remove objects to change the starting set count; keep at least one set per exercise.
- `reps` is a whole number from 1 to 1000. For single-leg exercises, it means reps per side.
- `weight` is in kilograms, from 0 to 2000, with at most one decimal place. Use 0 for bodyweight or as an unconfigured starting value.
- The sample uses 10 reps and 0 kg as editable placeholders, not a prescribed training load.
- Templates contain starting values only. Completion and session history belong in saved app data.

The top-bar selector loads Full Body, Upper, Lower, and the original Full Body A. Each workout retains its own edited sets and completion state in browser storage. The last selected workout is restored on reopening.

Serve the repository through GitHub Pages or a local HTTP server (`python -m http.server 8000` from the repository folder). Opening `index.html` directly cannot fetch JSON templates.

To register another template, add an option to `#workout-select` in `index.html` with its ID as the value. The app loads `workouts/<id>.json`. Keep IDs stable so saved workout data remains associated with the correct template.
