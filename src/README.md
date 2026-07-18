# PR03.2 Commit-4 — Enterprise Payment Terminal Management

Copy the included `src/modules/accounting` files into the matching project folder.

This package expects the Commit-3 hook API:

- `terminals`
- `settlementAccounts`
- `loading`
- `saving`
- `error`
- `search`
- `setSearch`
- `createTerminal(payload)`
- `updateTerminal(id, payload)`
- `toggleTerminalStatus(terminal)`
- `removeTerminal(id)`
- `refresh()`

## Required shared CSS classes

The UI uses these existing AEDS utility classes:

- `aeds-input`
- `aeds-button-primary`
- `aeds-button-secondary`

If they are not available, replace them with your project button/input classes or add equivalents in the global stylesheet.

## Integration example

```jsx
import { PaymentConfigurationPage } from './modules/accounting'

<PaymentConfigurationPage tenantId={session.tenantId} />
```

## Local verification

```powershell
npm run build
```

## Commit

```powershell
git add src/modules/accounting
git commit -m "feat(payments): add enterprise payment terminal management UI"
git push origin feature/pr03-2-payment-configuration
```
