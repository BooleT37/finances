import type { Locator, Page } from '@playwright/test';

import type { EnableBankingTransaction } from '../../src/features/import/BankConnector/EnableBankingClient';
import { testPrisma } from './db/client';
import { TEST_PROJECT_ID, TEST_USER_ID } from './db/seed';
import { expect, test } from './fixtures';
import { setEnableBankingStub } from './stubs/enableBankingStub';

const OWN_NAME = 'Test Admin';
const STUB_ACCOUNT = { uid: 'stub-account', currency: 'EUR', product: 'Main' };

function bankTransaction(
  overrides: Partial<EnableBankingTransaction>,
): EnableBankingTransaction {
  return {
    entry_reference: 'i_card',
    transaction_amount: { currency: 'EUR', amount: '12.50' },
    credit_debit_indicator: 'DBIT',
    status: 'BOOK',
    booking_date: '2024-04-10',
    creditor: { name: 'REWE Markt' },
    debtor: { name: OWN_NAME },
    remittance_information: [],
    bank_transaction_code: {
      description: 'PMNT',
      code: 'CCRD',
      sub_code: 'POSD',
    },
    ...overrides,
  };
}

// The seed has a hand-entered 50 EUR transaction on April 1st, so the Lidl
// row counts as already imported.
const BANK_TRANSACTIONS = [
  bankTransaction({}),
  bankTransaction({
    entry_reference: 'i_lidl',
    transaction_amount: { currency: 'EUR', amount: '50.00' },
    booking_date: '2024-04-01',
    creditor: { name: 'Lidl' },
  }),
  bankTransaction({
    entry_reference: 'i_salary',
    transaction_amount: { currency: 'EUR', amount: '2000.00' },
    credit_debit_indicator: 'CRDT',
    booking_date: '2024-04-05',
    creditor: { name: OWN_NAME },
    debtor: { name: 'Employer GmbH' },
    remittance_information: ['April salary'],
    bank_transaction_code: {
      description: 'PMNT',
      code: 'RRCT',
      sub_code: 'ESCT',
    },
  }),
];

async function vividSourceId() {
  const source = await testPrisma.source.findFirstOrThrow({
    where: { projectId: TEST_PROJECT_ID, name: 'Vivid' },
  });
  return source.id;
}

async function connectSource(
  sourceId: number,
  { expiresAt = new Date('2024-10-12') }: { expiresAt?: Date } = {},
) {
  await testPrisma.bankConnection.create({
    data: {
      sourceId,
      projectId: TEST_PROJECT_ID,
      connector: 'VIVID',
      sessionId: 'stub-session',
      accountUid: STUB_ACCOUNT.uid,
      expiresAt,
    },
  });
}

async function openImport(page: Page, sourceName: string) {
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Импорт', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Источник' }).click();
  await page.getByRole('option', { name: sourceName, exact: true }).click();
  return dialog;
}

const bankImportButton = (dialog: Locator) =>
  dialog.getByRole('button', { name: 'Импортировать из банка', exact: true });

const importFromDate = (dialog: Locator) =>
  dialog.getByRole('button', { name: 'Начиная с:' });

const rowCheckbox = (dialog: Locator, description: string) =>
  dialog.getByRole('checkbox', { name: `Импортировать «${description}»` });

test.describe('Bank import', () => {
  test('connects a source to the bank and disconnects it', async ({ page }) => {
    await setEnableBankingStub({ accounts: [STUB_ACCOUNT], transactions: [] });

    await page.goto('/settings/sources');
    await expect(
      page.getByRole('columnheader', { name: 'Подключено до' }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Подключить банковский счёт', exact: true })
      .click();

    await expect(page.getByText('Банковский счёт подключён')).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/sources$/);
    await expect(page.getByText('12.10.2024')).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Подключить банковский счёт заново' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Отключить банковский счёт' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Отключить', exact: true })
      .click();

    await expect(page.getByText('«Vivid» отключён от банка')).toBeVisible();
    await expect(page.getByText('12.10.2024')).toHaveCount(0);
    await expect(
      page.getByRole('button', {
        name: 'Подключить банковский счёт',
        exact: true,
      }),
    ).toBeVisible();
    expect(await testPrisma.bankConnection.count()).toBe(0);
  });

  test('lets the user pick one of several EUR accounts', async ({ page }) => {
    await setEnableBankingStub({
      accounts: [
        {
          uid: 'main',
          currency: 'EUR',
          product: 'Main',
          account_id: { iban: 'DE00123' },
        },
        { uid: 'pocket', currency: 'EUR', name: 'Pocket' },
        { uid: 'dollars', currency: 'USD', name: 'Dollars' },
      ],
      transactions: [],
    });

    await page.goto('/settings/sources');
    await page
      .getByRole('button', { name: 'Подключить банковский счёт', exact: true })
      .click();

    await expect(
      page.getByRole('radio', { name: 'Main · DE00123' }),
    ).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Dollars' })).toHaveCount(0);
    await page.getByRole('radio', { name: 'Pocket' }).check();
    await page.getByRole('button', { name: 'Выбрать этот счёт' }).click();

    await expect(page.getByText('Банковский счёт подключён')).toBeVisible();
    await expect(page.getByText('12.10.2024')).toBeVisible();
    const connection = await testPrisma.bankConnection.findFirstOrThrow();
    expect(connection.accountUid).toBe('pocket');
  });

  test('imports transactions from the bank and recognises them next time', async ({
    page,
  }) => {
    await connectSource(await vividSourceId());
    await setEnableBankingStub({
      accounts: [STUB_ACCOUNT],
      transactions: BANK_TRANSACTIONS,
    });

    let dialog = await openImport(page, 'Vivid');
    await expect(dialog.getByText('Загрузить PDF-выписку')).toBeVisible();
    await expect(importFromDate(dialog)).toHaveText('01.04.2024');
    await bankImportButton(dialog).click();

    await expect(rowCheckbox(dialog, 'REWE Markt')).toBeChecked();
    await expect(rowCheckbox(dialog, 'Lidl')).not.toBeChecked();
    await expect(
      rowCheckbox(dialog, 'Employer GmbH April salary'),
    ).toBeChecked();
    await rowCheckbox(dialog, 'Employer GmbH April salary').uncheck();

    const treeSelect = dialog.locator('[data-expense-row="0"] .treeSelect');
    await treeSelect.click();
    await treeSelect
      .locator('.rc-tree-select-selection-search-input')
      .fill('Продукты');
    await page
      .locator('.treeSelectDropdown')
      .getByText('Продукты', { exact: true })
      .first()
      .click();
    await dialog
      .getByRole('button', { name: 'Импортировать', exact: true })
      .click();

    await expect(page.getByText('Добавлена 1 транзакция')).toBeVisible();
    await expect(page.getByText('REWE Markt')).toBeVisible();
    const imported = await testPrisma.expense.findFirstOrThrow({
      where: { importedDescription: 'REWE Markt' },
    });
    expect(imported.importHash).not.toBeNull();

    dialog = await openImport(page, 'Vivid');
    await expect(importFromDate(dialog)).toHaveText('13.04.2024');
    await bankImportButton(dialog).click();

    await expect(rowCheckbox(dialog, 'REWE Markt')).not.toBeChecked();
    await expect(rowCheckbox(dialog, 'Lidl')).not.toBeChecked();
    await expect(
      rowCheckbox(dialog, 'Employer GmbH April salary'),
    ).toBeChecked();
  });

  test('handles a bank-only source, an empty period, an expired connection and a member', async ({
    page,
  }) => {
    const bankOnly = await testPrisma.source.create({
      data: { name: 'Bank only', projectId: TEST_PROJECT_ID },
    });
    await connectSource(bankOnly.id);
    await connectSource(await vividSourceId(), {
      expiresAt: new Date('2024-04-01'),
    });
    await setEnableBankingStub({ accounts: [STUB_ACCOUNT], transactions: [] });

    let dialog = await openImport(page, 'Bank only');
    await expect(dialog.getByText('Загрузить PDF-выписку')).toHaveCount(0);
    await bankImportButton(dialog).click();
    await expect(
      dialog.getByText('В банке нет транзакций за этот период.'),
    ).toBeVisible();

    dialog = await openImport(page, 'Vivid');
    await bankImportButton(dialog).click();
    await expect(
      dialog.getByText('Подключение к банку истекло.'),
    ).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Подключите заново в настройках' }),
    ).toBeVisible();

    await testPrisma.user.update({
      where: { id: TEST_USER_ID },
      data: { role: 'user' },
    });

    dialog = await openImport(page, 'Vivid');
    await bankImportButton(dialog).click();
    await expect(
      dialog.getByText(
        'Подключение к банку истекло. Попросите администратора проекта обновить его.',
      ),
    ).toBeVisible();

    await page.goto('/settings/sources');
    await expect(
      page.getByRole('columnheader', { name: 'Подключено до' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /банковский счёт/ }),
    ).toHaveCount(0);
  });
});
