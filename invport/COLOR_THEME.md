# Website presentation

The dealer portal uses a light, neutral website layout: a white brand header,
horizontal navigation, a centered content area, and a full-width footer.
Mobile navigation expands in document flow; it no longer uses a side drawer.

## Typography and color

| Purpose | Value |
| --- | --- |
| Body and controls | Segoe UI, Arial, sans-serif |
| Page background | `#f9fafb` |
| Content surfaces | `#ffffff` |
| Main text | `#111827` |
| Secondary text | `#4b5563` |
| Primary actions | Slate `#334155`, hover `#1e293b` |
| Borders | `#e5e7eb` |

Segoe UI is first in the font stack. Where it is not installed, Arial is used;
the site no longer downloads Google fonts. Green is reserved for meaningful
success/availability states, not branding, prices, navigation, or save actions.
Warnings and destructive actions retain their semantic colors.

## Sources of truth

- [globals.css](src/app/globals.css): active Tailwind v4 CSS theme, legacy accent
  aliases, global font, focus indicators, selection, and reduced-motion support.
- [theme.ts](src/theme/theme.ts): Material UI palette, typography, borders, and
  component shape.
- [tailwind.config.js](tailwind.config.js): legacy configuration only. Tailwind v4
  uses the CSS theme; editing this file alone does not update the current site.

Prefer neutral surfaces and borders over gradients, nested panels, large corner
radii, or decorative shadows. Use color to communicate state. Keep controls
keyboard-accessible and preserve a visible focus indicator.
