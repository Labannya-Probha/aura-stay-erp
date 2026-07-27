# Phase 1 Stacking Test Matrix

This checklist validates deterministic stacking behavior after z-layer token rollout.

## Scope

- Reports grid: sticky header, frozen column, grouped row, sticky footer, toolbar popover
- Reservations booking engine: sticky timeline headers, reservation bars, drawer overlay

## Environments

- Desktop: 1366x768, 1920x1080
- Laptop zoom: 90%, 100%, 125%
- Browser: Chromium latest

## Reports Grid Matrix

| Case ID  | Scenario                   | Steps                                        | Expected                                                    |
| -------- | -------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| RPT-Z-01 | Header above body rows     | Open any working report, scroll vertically   | Header stays visible and never hides under data rows        |
| RPT-Z-02 | Frozen column alignment    | Scroll horizontally and vertically together  | Frozen column stays pinned without clipping header text     |
| RPT-Z-03 | Group row vs frozen column | Enable grouped output and scroll             | Group row remains readable and does not overlap frozen text |
| RPT-Z-04 | Footer precedence          | Scroll to bottom with many rows              | Sticky footer remains above row content and under popovers  |
| RPT-Z-05 | Popover precedence         | Open column dropdown while table is scrolled | Popover appears above header, body, and footer layers       |
| RPT-Z-06 | Empty state layering       | Trigger no-data filter condition             | Empty state appears centered without clipping artifacts     |

## Reservations Matrix

| Case ID  | Scenario                  | Steps                                    | Expected                                                      |
| -------- | ------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| RSV-Z-01 | Sticky date header        | Scroll booking grid vertically           | Date header remains pinned and readable                       |
| RSV-Z-02 | Sticky room column        | Scroll horizontally in timeline          | Room column remains pinned without covering date labels       |
| RSV-Z-03 | Reservation bars hitbox   | Click reservation bars near sticky edges | Click target is consistent and not blocked by sticky elements |
| RSV-Z-04 | Drawer overlay precedence | Open reservation drawer                  | Drawer and backdrop appear above timeline and accept focus    |

## Exit Criteria

- All matrix cases pass at 100% zoom
- No overlap defects at 125% zoom
- No regression in report print mode
