# PR03.2 Commit-4 — Enterprise Payment Terminal Management

Copy the included `src/modules/accounting` files into the matching project folder.

This package uses `usePaymentConfiguration` (in `hooks/usePaymentConfiguration.js`), which returns:

- `terminals`
- `settlementAccounts`
- `search`
- `setSearch`
- `isLoading`
- `isRefreshing`
- `isSaving`
- `pendingTerminalId`
- `error`
- `clearError()`
- `refresh()`
- `createTerminal(payload)`
- `updateTerminal(id, payload)`
- `toggleTerminalStatus(terminal)`
- `removeTerminal(id)`

## Styling

The UI is styled with Tailwind CSS utility classes (e.g. `bg-slate-900`, `rounded-xl`). No separate AEDS utility classes are required.

## Integration example

```jsx
import { PaymentConfigurationPage } from './modules/accounting/payment-configuration'

<PaymentConfigurationPage />
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
