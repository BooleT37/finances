import { List, Table, Text } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';

import {
  LegalContactEmail,
  LegalPage,
  LegalSection,
} from '~/components/LegalPage';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy' }] }),
  component: PrivacyPage,
});

const PROCESSORS = [
  {
    name: 'Vercel',
    purpose: 'Hosting and serving the application',
    location: 'EU',
  },
  {
    name: 'Supabase',
    purpose: 'PostgreSQL database storing all of your data',
    location: 'EU (Frankfurt)',
  },
  { name: 'PostHog', purpose: 'Usage analytics', location: 'EU' },
  {
    name: 'Google',
    purpose: 'Optional sign-in with a Google account',
    location: 'USA (EU SCCs / DPF)',
  },
  {
    name: 'TypeSafe',
    purpose: 'Category autofill, only if an admin has turned it on',
    location:
      'USA (no SCCs or DPF; data is transferred on the basis of your consent)',
  },
  {
    name: 'Langfuse',
    purpose: 'Checking the quality of category autofill, only if it is on',
    location: 'EU',
  },
  {
    name: 'Enable Banking',
    purpose: "Read-only bank connection for the operator's own accounts",
    location: 'EU (Finland)',
  },
];

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-10-25">
      <Text>
        This is a private, invite-only personal finance application. There is no
        public sign-up and no advertising, and your data is never sold or shared
        for marketing.
      </Text>

      <LegalSection heading="Who is responsible">
        <Text>
          Aleksei Levin, Germany. Contact: <LegalContactEmail />.
        </Text>
      </LegalSection>

      <LegalSection heading="What data is processed">
        <List spacing="xs">
          <List.Item>
            <b>Account data:</b> your name, email address and password hash. If
            you sign in with Google, also your profile image and the OAuth
            tokens needed to keep you signed in.
          </List.Item>
          <List.Item>
            <b>Session data:</b> session token, expiry, IP address and browser
            user agent.
          </List.Item>
          <List.Item>
            <b>Financial data you enter:</b> transactions (description, amount,
            date, category), budgets and forecasts, subscriptions, savings
            plans, and the names of your categories and sources.
          </List.Item>
          <List.Item>
            <b>Bank statements you upload:</b> the PDF is read on the server and
            not stored. Only the rows you choose to import are kept, including
            the bank&apos;s original description.
          </List.Item>
          <List.Item>
            <b>Category autofill, only if an admin has turned it on:</b> when
            you import data, each row&apos;s description, amount and date are
            sent to TypeSafe to suggest a category, together with similar past
            transactions and the names of your categories and subscriptions.
            Langfuse records the same requests so the quality of the suggestions
            can be checked. TypeSafe states that it does not train models on
            this data.
          </List.Item>
          <List.Item>
            <b>Bank connections:</b> currently set up only for the
            operator&apos;s own accounts. Booked transactions are retrieved
            read-only over PSD2: date, amount, counterparty and reference text.
            Everyone else imports bank statements instead.
          </List.Item>
          <List.Item>
            <b>Usage analytics:</b> which actions you perform, whether they
            succeed and how long they take; amounts, dates and internal ids; the
            names of your categories, subcategories, sources, subscriptions,
            savings goals and project; and the type of error when an action
            fails. Events are linked to your user id, name and email. They never
            include transaction descriptions, comments, other people&apos;s
            names or email addresses, or file contents.
          </List.Item>
        </List>
      </LegalSection>

      <LegalSection heading="Why, and on what legal basis">
        <List spacing="xs">
          <List.Item>
            Account, session and financial data, and statement imports: to
            provide the application to you (Art. 6(1)(b) GDPR, performance of a
            contract).
          </List.Item>
          <List.Item>
            Usage analytics and security logging: our legitimate interest in
            keeping the application working and diagnosing faults (Art. 6(1)(f)
            GDPR).
          </List.Item>
          <List.Item>
            Category autofill: your consent (Art. 6(1)(a) GDPR), which also
            covers the transfer to TypeSafe in the USA (Art. 49(1)(a) GDPR). An
            admin gives it for the household by turning category autofill on in
            the project settings, and withdraws it at any time by turning it
            off.
          </List.Item>
          <List.Item>
            Bank connections: your explicit consent (Art. 6(1)(a) GDPR),
            withdrawn at any time by disconnecting the bank or revoking access
            at the bank.
          </List.Item>
        </List>
      </LegalSection>

      <LegalSection heading="Who else sees your data">
        <Text>
          Only the services below process your data, and only for the purpose
          listed. Nobody else receives it, and it is never sold.
        </Text>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Processor</Table.Th>
              <Table.Th>Purpose</Table.Th>
              <Table.Th>Location</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {PROCESSORS.map((processor) => (
              <Table.Tr key={processor.name}>
                <Table.Td>{processor.name}</Table.Td>
                <Table.Td>{processor.purpose}</Table.Td>
                <Table.Td>{processor.location}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </LegalSection>

      <LegalSection heading="Bank connections">
        <Text>
          Bank connections are currently available only for the operator&apos;s
          own accounts. Access is read-only: the application cannot move money,
          initiate payments or change anything at the bank. Access is granted
          through the bank&apos;s own authentication and expires automatically
          after at most 180 days unless renewed. Disconnecting stops all further
          access; transactions already imported stay until they are deleted.
        </Text>
      </LegalSection>

      <LegalSection heading="How long data is kept">
        <List spacing="xs">
          <List.Item>Your data is kept while your account exists.</List.Item>
          <List.Item>
            Deleting a user removes that user and their sessions immediately.
          </List.Item>
          <List.Item>
            Financial records belong to the household rather than to an
            individual user, and stay until they are deleted in the application
            or the household is removed.
          </List.Item>
          <List.Item>
            PostHog, TypeSafe and Langfuse keep data according to their own
            retention settings.
          </List.Item>
        </List>
      </LegalSection>

      <LegalSection heading="Your rights">
        <Text>
          Under Articles 15 to 21 GDPR you have the right to access,
          rectification, erasure, restriction of processing, data portability
          and objection. To use any of them, write to <LegalContactEmail />. You
          also have the right to complain to a data protection supervisory
          authority; in Germany, that is the authority of your federal state.
          There is no automated decision-making or profiling within the meaning
          of Art. 22 GDPR.
        </Text>
      </LegalSection>

      <LegalSection heading="Cookies and local storage">
        <Text>
          A session cookie keeps you signed in. Your browser&apos;s local
          storage keeps your language and interface preferences, such as the
          collapsed menu, the selected month and hints you have hidden. There
          are no tracking or advertising cookies.
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
