# TransactionsPage — Spec

## What we're porting

`finances-t3/src/features/expense/components/DataScreen.tsx` → `src/features/transactions/components/TransactionsPage.tsx`

## What we already have (skip)

- **Month/year navigation** — handled by `MonthNavigator` in layout; atoms in `stores/month.ts`
- **`useTransactionTableItems({ showUpcoming, searchString })`** — already implemented
- **`getUserSettingsQueryOptions()`** — already in `features/userSettings/queries.ts`

## What the old DataScreen does (mapped to new)

| Old (DataScreen)                          | New (TransactionsPage)                              |
| ----------------------------------------- | --------------------------------------------------- |
| Date picker / range picker / prev-next    | Already in layout → **skip**                        |
| `search` state + `<Search>` input         | `useState` + Mantine `TextInput`                    |
| `upcSubscriptionsShown` checkbox          | `useState` + Mantine `Checkbox`                     |
| `groupBySubcategories` checkbox           | `useState` + Mantine `Checkbox`                     |
| "Add" button → opens ExpenseModal         | Mantine `Button` + `transactionModal.open(null)`    |
| "Import" button → opens ImportModal       | Mantine `Button` + `importModal.open()`             |
| `<DataTable>` component                   | **TODO placeholder** `<TransactionTable>`           |
| `<ExpenseModal>`                          | **TODO placeholder** `<TransactionModal>`           |
| `<ImportModal>` + `<ParsedExpensesModal>` | **TODO placeholder** `<ImportModal>`                |
| `ExpenseModalContextProvider` wrapper     | Bunshi `<ScopeProvider>` (placeholder)              |
| `ImportModalContextProvider` wrapper      | Bunshi `<ScopeProvider>` (placeholder)              |
| `userSettingsLoaded` gate before table    | `useQuery(getUserSettingsQueryOptions()).isSuccess` |
| `tableInstanceRef` + `expandCategory`     | **Skip for now** — will be part of table component  |

## Plan

### 1. Install bunshi

`npm install bunshi`

We won't create actual molecules yet — just set up the `<ScopeProvider>` wrapper so the pattern is in place for when we implement the modals.

### 2. Create placeholder components

Files (empty stubs that render nothing or a TODO comment):

- `src/features/transactions/components/TransactionTable.tsx` — `export function TransactionTable(props: { items: TransactionTableItem[] }) { return null; }`
- `src/features/transactions/components/TransactionModal.tsx` — `export function TransactionModal() { return null; }`
- `src/features/transactions/components/ImportModal.tsx` — `export function ImportModal() { return null; }`

### 3. Rewrite `TransactionsPage.tsx`

```tsx
export function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [groupBySubcategories, setGroupBySubcategories] = useState(false);

  const items = useTransactionTableItems({ showUpcoming, searchString: search });
  const { isSuccess: userSettingsLoaded } = useQuery(getUserSettingsQueryOptions());

  return (
    <ScopeProvider>
      <Stack>
        <Group justify="space-between">
          <Group>
            <Button onClick={() => { /* TODO: transactionModal.open(null) */ }}>
              {t('add')}
            </Button>
            <Button variant="default" onClick={() => { /* TODO: importModal.open() */ }}>
              {t('import')}
            </Button>
          </Group>
          <TextInput
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
        </Group>

        <Group>
          <Checkbox
            label={t('upcomingSubscriptions')}
            checked={showUpcoming}
            onChange={(e) => setShowUpcoming(e.currentTarget.checked)}
          />
          <Checkbox
            label={t('groupBySubcategories')}
            checked={groupBySubcategories}
            onChange={(e) => setGroupBySubcategories(e.currentTarget.checked)}
          />
        </Group>

        {userSettingsLoaded && items ? (
          <TransactionTable items={items} />
        ) : (
          <Loader />
        )}
      </Stack>

      {/* TODO: modals render nothing for now */}
      <TransactionModal />
      <ImportModal />
    </ScopeProvider>
  );
}
```

### 4. Add i18n translations

Follow the colocated pattern (like `features/nav/`):

Create `src/features/transactions/locales/en/transactions.json`:

```json
{
  "add": "Add",
  "import": "Import",
  "searchPlaceholder": "Search...",
  "upcomingSubscriptions": "Upcoming subscriptions",
  "groupBySubcategories": "Group by subcategories"
}
```

Create `src/features/transactions/locales/ru/transactions.json`:

```json
{
  "add": "Добавить",
  "import": "Импорт",
  "searchPlaceholder": "Найти...",
  "upcomingSubscriptions": "Предстоящие подписки",
  "groupBySubcategories": "Сгруппировать по подкатегориям"
}
```

Create `src/features/transactions/i18n.ts`:

```ts
import en from './locales/en/transactions.json';
import ru from './locales/ru/transactions.json';

export const i18nResources = {
  en: { transactions: en },
  ru: { transactions: ru },
} as const;
```

Register in `src/lib/i18n/index.ts` (merge with existing resources, same as `nav`).

Use in `TransactionsPage.tsx`:

```tsx
const { t } = useTranslation('transactions');
// t('add'), t('searchPlaceholder'), etc.
```

### 5. Differences from old code (intentional)

- **No range picker / "all time" button** — we use month/year viewMode instead.
- **No `handleSearch` that switches to range mode** — search just filters within current month/year.
- **No `expandCategory` / `tableInstanceRef`** — deferred to table implementation.
- **`groupBySubcategories`** is just state for now — passed to `TransactionTable` but table is a stub.

## Files to create/modify

| File                                                        | Action                            |
| ----------------------------------------------------------- | --------------------------------- |
| `src/features/transactions/components/TransactionsPage.tsx` | Rewrite                           |
| `src/features/transactions/components/TransactionTable.tsx` | Create (stub)                     |
| `src/features/transactions/components/TransactionModal.tsx` | Create (stub)                     |
| `src/features/transactions/components/ImportModal.tsx`      | Create (stub)                     |
| `src/features/transactions/locales/en/transactions.json`    | Create                            |
| `src/features/transactions/locales/ru/transactions.json`    | Create                            |
| `src/features/transactions/i18n.ts`                         | Create                            |
| `src/lib/i18n/index.ts`                                     | Register `transactions` namespace |
| `package.json`                                              | Add `bunshi` dependency           |

## Verification

`npm run typecheck && npm run lint && npm run format:check`
