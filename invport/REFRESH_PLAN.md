# Project refresh and unit-view analytics

## Scope

Refresh the existing private dealer website without turning it into a public
marketing site or changing inventory operations. Implement presentation and
dependency updates now; finalize view analytics after the other frontend/backend
team confirms its event and response contract. No database columns or endpoints
are assumed or created in this repository.

## Implemented refresh

- Replace the green sidebar and heavily rounded nested shell with a white header,
  horizontal navigation, neutral gray page background, and centered content.
- Use Segoe UI first across Tailwind and Material UI; remove Google font downloads.
- Flatten cards and filters, simplify dashboard shortcuts into links, and use
  slate actions. Keep semantic success, warning, and error colors.
- Preserve dashboard, inventory, view modal, add/edit, report, and sign-out routes.
  Add breadcrumb names for both details screens, keyboard metric activation,
  a skip link, accessible mobile menu controls, and reduced-motion handling.
- Correct both unit-details loaders to parse the HTTP response and accept the
  documented inventory response envelopes; previously it treated `Response` as
  an array and always displayed a load error.
- Upgrade retained application dependencies, align Next and its ESLint config,
  and remove unused MUI lab/date-picker packages and redundant UUID types.
- Replace the unpatched npm `xlsx` package with `write-excel-file`, preserving
  Excel headers, numeric cells, currency formats, sheet/file names, and empty
  exports. Share CSV generation and neutralize spreadsheet formula text.
- Ship the existing access-control configuration in both production build paths.
  A failed static build or missing access configuration now exits unsuccessfully.
- Keep the upgraded radar chart responsive by stretching its container; a zero
  inventory total uses a nonzero axis range rather than an invalid scale.

## Analytics integration map (pending contract)

The active inventory screen uses [useInventoryAPI.ts](src/hooks/useInventoryAPI.ts)
to normalize `/GrabInventoryAll` into [Vehicle](src/types/index.ts).
It renders [CompactInventoryCard](src/components/inventory/CompactInventoryCard.tsx)
and opens [VehicleDetailsModal](src/components/modals/VehicleDetailsModal.tsx).
There are also independent details loaders in
[item/page.tsx](src/app/inventory/item/page.tsx) and
[vehicle/page.tsx](src/app/inventory/vehicle/page.tsx), plus the edit loader in
[edit/page.tsx](src/app/inventory/edit/page.tsx). The SWR and cached inventory hooks
must use the same mapping if analytics are exposed through them.

No documented response field currently supplies view counts. Do not interpret
the existing marketing `banner` field as analytics or overwrite it with "Hot".

### What should count

The other customer-facing frontend records a view when a visitor actually opens
a unit. This admin site should initially **read** those totals, not increment
them when staff preview or edit inventory. Confirm this assumption when the
contract arrives. Record an event once per intentional navigation/open, not once
per React render, effect replay, image request, data refresh, or modal re-render.
Agree whether reloads and repeated opens count; prevent duplicate retries with an
event identifier if the event API supports one.

### Required contract details

Confirm:

1. Stable unit identity (`UnitID` or another identifier), actual response property
   names, and whether analytics travel on existing unit responses or a batch API.
2. Total views, monthly views, previous comparable-period views, period start/end,
   last-updated timestamp, and when tracking started.
3. Calendar month versus trailing 30 days, the reporting time zone, and whether
   previous-period counts are compared at the same elapsed point in the month.
4. Whether counts include repeat visitors, staff, bots, and sold units; retention,
   deduplication/rate limiting, atomic event updates, and appropriate API access.
5. The finalized "cold" threshold and a minimum exposure period for new units.

Prefer server-side aggregates or one batch response over an extra request per
inventory card. Never expose storage credentials or raw visitor identifiers to
this admin frontend. Live external API authorization must be verified separately.

### Presentation

- **Inventory overview:** show "Views this month" and optionally total views on
  every card, with sorting/filtering by monthly interest.
- **Dashboard:** list the highest monthly-view units with counts and links. Do
  not label inventory-value or sales charts as visitor trends.
- **View modal, both details pages, and edit page:** show the same read-only
  analytics block, reporting period, and freshness. Counts must not be editable
  unit fields or included in ordinary save payloads.
- **Hot:** strictly more than 40 views in the agreed month/30-day period:
  40 is not hot; 41 is. Use a separate admin-only badge near the count, not a
  customer-visible marketing banner or a saved unit status.
- **Trend:** an up/down arrow only when the backend supplies a comparable prior
  period. Show "New activity" rather than an infinite percentage for a zero
  baseline. Equal counts get a neutral state.
- **Cold:** defer the label until the threshold and exposure rule are approved;
  do not classify brand-new units or missing data as cold.
- **Unknown/unavailable:** show "Views unavailable" (or a loading state), never
  a fabricated zero. A measured zero remains distinguishable from missing data.
  If analytics fail, preserve inventory access and show a clear analytics error.

### Implementation sequence when the contract arrives

1. Confirm sample responses and counting rules without changing production data.
2. Add typed analytics data and one shared validated adapter; reuse it across all
   unit loaders, overview cards, details, edit, SWR, and cache paths.
3. Add the shared read-only count/badge/trend presentation and dashboard ranking.
4. Wire sorting/filtering and batch refresh/cache invalidation; keep inventory
   saves separate from analytics and preserve existing marketing banners.
5. Test 0/40/41 views, absent/invalid counts, new tracking, period boundaries,
   zero/equal/rising/falling baselines, loading/failure, and new/sold units.
6. Coordinate event-writer checks with the customer-facing frontend: duplicate
   renders/retries, modal reopens, direct navigation, concurrency, bots/staff,
   and authorization. Only then enable live analytics.

## Upgrade boundaries

Use Node 24 LTS (the shared [.nvmrc](../.nvmrc)); package engines require at least
Node 22.13 and npm 11. CI reads that same runtime declaration.

Retained runtime packages are upgraded to current stable registry releases.
TypeScript is held at 6.0.3 because the current TypeScript ESLint parser declares
support below 6.1; registry TypeScript 7 is not supported. ESLint stays at the
latest compatible 9.x because React and JSX accessibility plugins do not declare
ESLint 10 support. Node typings match the selected 24 LTS runtime rather than 26.
Do not bypass peer constraints or force npm's suggested downgrade to ESLint 4.

New React Compiler-oriented lint rules report warnings rather than blocking the
existing non-Compiler application. Existing hook dependency checks remain active.

## Security review and verification

The high-confidence source finding was omitted static access configuration;
both build commands now include it. External API authorization cannot be proven
from this frontend-only repository. The npm `xlsx` advisories are removed by the
writer migration; Next is upgraded to its audit-fixed release.

After installation and `npm audit fix`, the production audit reports zero
vulnerabilities. The full audit still reports 16 moderate development-tool
advisories rooted in `minimatch <11.0.1` through ESLint and its plugins. A forced
major override would break the older callable minimatch API; this is deferred
until upstream tooling supports a compatible patched dependency.

Validation commands:

```text
npm run test
npm run typecheck
npm run lint
npm run build
npm run build:static
npm audit --omit=dev
npm audit
```

Browser checks cover desktop/mobile navigation, dashboard, populated and empty
inventory, details, edit, add, reports, and export. Local fixture responses can
verify UI behavior but do not establish live database/API permissions or event
counting; those remain final integration checks when analytics are ready.

Verified in this refresh:

- Ten regression tests pass, including response envelopes/ID casing, numeric
  zeros, Excel/CSV exports, and successful/failed static build behavior.
- Type checking and both production build paths pass. The exported access
  configuration matches its source byte-for-byte.
- Lint passes with zero errors and 44 warnings, including pre-existing issues
  newly surfaced by the upgraded React Compiler-oriented rules.
- Browser fixtures verify both details loaders, edit field values, add-route
  highlighting, empty inventory, and mobile layouts without horizontal overflow.
  The view dialog traps focus, closes with Escape, and restores focus.
- The report chart stretches to its available width and zero totals produce no
  invalid SVG paths. Browser Excel export produces the expected XLSX MIME type,
  ZIP signature, and `inventory-summary.xlsx` filename.
