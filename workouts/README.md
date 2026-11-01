# Workout templates

Copy `full-body-a.json` to a new JSON file to define another workout.

- Give each workout a unique, stable `id` and a display `name`.
- List exercises in the order they should appear.
- Each object in `sets` represents one set. Add or remove objects to change the starting set count; keep at least one set per exercise.
- `reps` is a whole number from 1 to 1000. For single-leg exercises, it means reps per side.
- `weight` is in kilograms, from 0 to 2000, with at most one decimal place. Use 0 for bodyweight or as an unconfigured starting value.
- The sample uses 10 reps and 0 kg as editable placeholders, not a prescribed training load.
- Templates contain starting values only. Completion and session history belong in saved app data.

The app does not load these files yet. Workout selection and loading are a separate implementation step.
