# UI Styling Guide

This project uses both Tailwind CSS and MUI. To keep things consistent:

- Layout and shells: Use Tailwind for page shells, layout containers, spacing, and simple visual utilities.
- Controls and forms: Use MUI components for inputs, selects, buttons, dialogs, and complex UI states.
- Mixing: Avoid overlapping responsibilities (e.g., don’t apply heavy Tailwind visual styles on MUI controls beyond spacing).
- Accessibility: Ensure focus-visible styles are present; add `aria-*` attributes on custom components (navigation, modals).
- Motion: Prefer subtle, short transitions (`opacity`, `transform`) and avoid large shadows/scale.
- Theming: Keep color usage consistent with the brand palette; verify contrast for WCAG AA.

Adopt these patterns in new components and refactors to reduce style drift.
