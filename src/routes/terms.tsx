import { Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import {
  LegalContactEmail,
  LegalPage,
  LegalSection,
} from '~/components/LegalPage';

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [{ title: 'Terms of Service' }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="2026-10-25">
      <Text>
        These terms govern your use of this personal finance application,
        operated privately by Aleksei Levin, Germany. Contact:{' '}
        <LegalContactEmail />.
      </Text>

      <LegalSection heading="What this is">
        <Text>
          A private tool for tracking household income, spending and budgets. It
          is free of charge and not a commercial service. It is not a bank, a
          payment service or a financial adviser, and nothing in it is financial
          advice.
        </Text>
      </LegalSection>

      <LegalSection heading="Access">
        <Text>
          Access is by invitation only; there is no public registration. An
          administrator creates accounts and can remove them. You are
          responsible for keeping your password confidential and for everything
          done through your account. Accounts are personal, so do not share
          yours.
        </Text>
      </LegalSection>

      <LegalSection heading="Bank connections">
        <Text>
          Bank connections are currently available only to the operator; other
          users import bank statements instead. A connected bank is accessed
          through a licensed open banking provider, read-only, and the
          application cannot move money. Access is authorised at the bank and
          can be revoked there at any time. Imported data may be incomplete or
          delayed, so treat the bank&apos;s own statements as authoritative.
        </Text>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <Text>
          Use the application only for its intended purpose. Do not try to
          access another household&apos;s data, disrupt the service, or use it
          unlawfully.
        </Text>
      </LegalSection>

      <LegalSection heading="No warranty">
        <Text>
          The application is provided as is, without warranty of any kind. There
          is no guarantee of availability, accuracy or freedom from errors, and
          no obligation to maintain the application or preserve your data. Keep
          your own records of anything you cannot afford to lose. Category
          autofill is automatic and can be wrong, so check the suggested
          categories before saving them.
        </Text>
      </LegalSection>

      <LegalSection heading="Liability">
        <Text>
          Liability is excluded to the fullest extent permitted by law. Nothing
          in these terms limits liability for intent or gross negligence, for
          injury to life, body or health, or under the German Product Liability
          Act, none of which can be excluded.
        </Text>
      </LegalSection>

      <LegalSection heading="Changes and termination">
        <Text>
          These terms may change; the date at the top shows the current version.
          Access may be withdrawn and the application discontinued at any time.
          You may stop using it at any time and ask for your account to be
          deleted.
        </Text>
      </LegalSection>

      <LegalSection heading="Governing law">
        <Text>
          German law applies, without prejudice to the mandatory consumer
          protection rules of the country where you live.
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
