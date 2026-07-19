# AEDS v7 Platform

`src/platform` is the stable architecture layer for Aura Stay ERP.

## Responsibilities

- module registry
- page registry
- feature flags
- metadata contracts
- platform-wide providers
- architecture rules

## Boundaries

`platform` must not import business pages from `modules` or `pages`.

Business modules may import from `platform`.

## Migration target

Legacy:

```text
src/pages/AccountingHub.jsx
src/pages/HrOffice.jsx
src/pages/InventoryHub.jsx
```

Target:

```text
src/modules/accounting/
src/modules/hr/
src/modules/inventory/
```

The legacy pages can remain temporarily as compatibility adapters while business logic is moved gradually.
